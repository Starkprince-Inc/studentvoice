"""Local, short-lived viewer for access-controlled review artifacts.

The server deliberately binds to loopback only. It never uploads evidence and
accepts a SHA-256 digest of the temporary access key through the environment.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import os
import secrets
import threading
import time
from datetime import UTC, datetime
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


COOKIE_NAME = "studentvoice_review"
KEY_HASH_ENV = "STUDENTVOICE_REVIEW_KEY_HASH"
STATE_FILE = ".review-state.json"


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _human_size(size: int) -> str:
    units = ("B", "KB", "MB", "GB")
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}" if unit != "B" else f"{size} B"
        value /= 1024
    return f"{size} B"


class ReviewServer(ThreadingHTTPServer):
    artifact_root: Path
    key_hash: str
    session_token: str
    expires_at: float


class ReviewHandler(BaseHTTPRequestHandler):
    server: ReviewServer

    def log_message(self, format: str, *args: object) -> None:
        super().log_message(format, *args)

    def _headers(self, status: HTTPStatus, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; "
            "form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        )

    def _expired(self) -> bool:
        return time.time() >= self.server.expires_at

    def _authenticated(self) -> bool:
        if self._expired():
            return False
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        supplied = cookie.get(COOKIE_NAME)
        return bool(
            supplied
            and secrets.compare_digest(supplied.value, self.server.session_token)
        )

    def _write_html(self, status: HTTPStatus, body: str) -> None:
        data = body.encode("utf-8")
        self._headers(status, "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _page(self, title: str, content: str) -> str:
        return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} · StudentVoice private review</title>
<style>
:root{{--paper:#f4f1e8;--ink:#11110f;--acid:#d9f24f;--muted:#625f58;--line:#cbc7bc}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,sans-serif}}
header{{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding:20px 4vw;position:sticky;top:0;background:var(--paper);z-index:2}}
.brand{{font-weight:900;letter-spacing:.04em}} .private{{font:800 12px Consolas,monospace;background:var(--ink);color:var(--acid);padding:9px 12px}}
main{{width:min(1120px,92vw);margin:55px auto 90px}} h1{{font:500 clamp(42px,7vw,82px)/.95 Georgia,serif;letter-spacing:-.05em;margin:12px 0 20px}}
.lede{{color:var(--muted);line-height:1.6;max-width:760px}} .grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px;margin-top:40px}}
article{{border:1px solid var(--line);background:#fffdf7;padding:18px}} img{{width:100%;height:auto;display:block;background:var(--ink)}}
h2{{font:600 25px Georgia,serif;margin:18px 0 8px}} code{{font-size:12px;overflow-wrap:anywhere}} .meta{{color:var(--muted);font-size:13px;line-height:1.55}}
.button,button{{display:inline-block;border:0;background:var(--ink);color:white;padding:12px 16px;font-weight:800;text-decoration:none;cursor:pointer}}
.button-row{{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}} .dismiss{{background:#8d2f23}} .restore{{background:#2f6b5f}}
.section-head{{display:flex;justify-content:space-between;align-items:end;margin-top:54px;border-top:3px solid var(--ink);padding-top:24px}} .section-head h2{{font-size:34px;margin:0}}
.dismissed-card{{opacity:.72}} .dismissed-card img{{filter:grayscale(1)}}
.login{{max-width:560px;margin:13vh auto;border:1px solid var(--line);background:white;padding:32px}} input{{width:100%;padding:13px;border:1px solid var(--line);margin:12px 0 18px;font:inherit}}
.warning{{border-left:5px solid var(--acid);background:var(--ink);color:white;padding:16px;line-height:1.5;margin:28px 0}}
@media(max-width:600px){{header{{align-items:flex-start;gap:12px}}}}
</style></head><body><header><span class="brand">● STUDENTVOICE</span><span class="private">LOCAL PRIVATE REVIEW</span></header>{content}</body></html>"""

    def _login_page(self, error: str = "") -> None:
        expiry = max(0, int((self.server.expires_at - time.time()) / 60))
        error_markup = (
            f'<p class="warning">{html.escape(error)}</p>' if error else ""
        )
        content = f"""<main><section class="login"><p>PROTECTED EVIDENCE WORKSPACE</p>
<h1>Temporary access</h1><p class="lede">Enter the temporary key. This local portal expires in approximately {expiry} minutes and never uploads artifacts.</p>
{error_markup}<form method="post" action="/login"><label for="key"><strong>Temporary review key</strong></label>
<input id="key" name="key" type="password" autocomplete="off" required autofocus><button type="submit">Unlock review artifacts</button></form></section></main>"""
        self._write_html(HTTPStatus.UNAUTHORIZED, self._page("Sign in", content))

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/logout":
            self._headers(HTTPStatus.SEE_OTHER, "text/plain; charset=utf-8")
            self.send_header("Location", "/")
            self.send_header(
                "Set-Cookie",
                f"{COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
            )
            self.end_headers()
            return
        if path in {"/dismiss", "/restore"}:
            if not self._authenticated():
                self._login_page("This review session has expired." if self._expired() else "")
                return
            try:
                length = min(int(self.headers.get("Content-Length", "0")), 4096)
            except ValueError:
                length = 0
            payload = self.rfile.read(length).decode("utf-8", errors="replace")
            from urllib.parse import parse_qs

            relative = parse_qs(payload).get("artifact", [""])[0]
            requested = (self.server.artifact_root / relative).resolve()
            root = self.server.artifact_root.resolve()
            if (
                not relative
                or requested == root
                or root not in requested.parents
                or not requested.is_file()
                or requested.name in {"manifest.json", STATE_FILE}
            ):
                self.send_error(HTTPStatus.BAD_REQUEST)
                return
            state = self._read_state()
            dismissed = state.setdefault("dismissed", {})
            now = datetime.now(UTC).isoformat()
            if path == "/dismiss":
                dismissed[relative] = {"dismissed_at": now}
                action = "dismissed"
            else:
                dismissed.pop(relative, None)
                action = "restored"
            state.setdefault("audit", []).append(
                {"action": action, "artifact": relative, "timestamp": now}
            )
            self._write_state(state)
            self._headers(HTTPStatus.SEE_OTHER, "text/plain; charset=utf-8")
            self.send_header("Location", "/")
            self.end_headers()
            return
        if path != "/login" or self._expired():
            self._login_page("This review session has expired.")
            return
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 4096)
        except ValueError:
            length = 0
        payload = self.rfile.read(length).decode("utf-8", errors="replace")
        from urllib.parse import parse_qs

        key = parse_qs(payload).get("key", [""])[0]
        if not secrets.compare_digest(_digest(key), self.server.key_hash):
            self._login_page("That temporary key is not valid.")
            return
        ttl = max(1, int(self.server.expires_at - time.time()))
        self._headers(HTTPStatus.SEE_OTHER, "text/plain; charset=utf-8")
        self.send_header("Location", "/")
        self.send_header(
            "Set-Cookie",
            f"{COOKIE_NAME}={self.server.session_token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={ttl}",
        )
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if not self._authenticated():
            self._login_page("This review session has expired." if self._expired() else "")
            return
        if path == "/":
            self._index()
            return
        if path.startswith("/artifact/"):
            self._artifact(unquote(path.removeprefix("/artifact/")))
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def _read_state(self) -> dict[str, object]:
        path = self.server.artifact_root / STATE_FILE
        if not path.exists():
            return {"dismissed": {}, "audit": []}
        try:
            value = json.loads(path.read_text("utf-8"))
            return value if isinstance(value, dict) else {"dismissed": {}, "audit": []}
        except (OSError, json.JSONDecodeError):
            return {"dismissed": {}, "audit": []}

    def _write_state(self, state: dict[str, object]) -> None:
        path = self.server.artifact_root / STATE_FILE
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
        temporary.replace(path)

    def _card(self, path: Path, dismissed: bool, digest_by_file: dict[str, str]) -> str:
        relative = path.relative_to(self.server.artifact_root).as_posix()
        escaped = html.escape(relative, quote=True)
        href = "/artifact/" + escaped
        mime, _ = mimetypes.guess_type(path.name)
        preview = (
            f'<a href="{href}" target="_blank"><img loading="lazy" src="{href}" alt="Private review derivative {escaped}"></a>'
            if mime and mime.startswith("image/")
            else ""
        )
        digest = digest_by_file.get(relative) or hashlib.sha256(path.read_bytes()).hexdigest()
        action = "restore" if dismissed else "dismiss"
        label = "Restore to queue" if dismissed else "Dismiss from queue"
        action_class = "restore" if dismissed else "dismiss"
        control = "" if path.name == "manifest.json" else (
            f'<form method="post" action="/{action}"><input type="hidden" name="artifact" value="{escaped}">'
            f'<button class="{action_class}" type="submit">{label}</button></form>'
        )
        card_class = "dismissed-card" if dismissed else ""
        return (
            f'<article class="{card_class}">{preview}<h2>{escaped}</h2>'
            f'<p class="meta">{_human_size(path.stat().st_size)}<br>SHA-256: <code>{digest}</code></p>'
            f'<div class="button-row"><a class="button" href="{href}" target="_blank">Open artifact</a>{control}</div></article>'
        )

    def _index(self) -> None:
        files = sorted(
            path
            for path in self.server.artifact_root.rglob("*")
            if path.is_file() and not path.name.startswith(".")
        )
        state = self._read_state()
        dismissed_map = state.get("dismissed", {})
        dismissed_names = set(dismissed_map) if isinstance(dismissed_map, dict) else set()
        manifest = {}
        manifest_path = self.server.artifact_root / "manifest.json"
        if manifest_path.exists():
            try:
                manifest = json.loads(manifest_path.read_text("utf-8"))
            except (OSError, json.JSONDecodeError):
                pass
        digest_by_file = {
            str(item.get("derivative_file")): str(item.get("sha256"))
            for item in manifest.get("items", [])
            if isinstance(item, dict) and item.get("derivative_file") and item.get("sha256")
        }
        active = [path for path in files if path.relative_to(self.server.artifact_root).as_posix() not in dismissed_names]
        dismissed = [path for path in files if path.relative_to(self.server.artifact_root).as_posix() in dismissed_names]
        active_cards = [self._card(path, False, digest_by_file) for path in active]
        dismissed_cards = [self._card(path, True, digest_by_file) for path in dismissed]
        minutes = max(0, int((self.server.expires_at - time.time()) / 60))
        dismissed_section = (
            f'<div class="section-head"><h2>Dismissed proposals</h2><span>{len(dismissed)} reversible</span></div><section class="grid">{"".join(dismissed_cards)}</section>'
            if dismissed_cards
            else ""
        )
        content = f"""<main><p>PROTECTED EVIDENCE WORKSPACE</p><h1>Private review artifacts</h1>
<p class="lede">{len(active)} active files and {len(dismissed)} dismissed proposals. Session expires in approximately {minutes} minutes.</p>
<div class="warning">Do not redistribute these files or use the anonymous boxes as identity evidence. Public release still requires rights clearance and editorial approval.</div>
<form method="post" action="/logout"><button type="submit">Lock portal</button></form><section class="grid">{''.join(active_cards)}</section>{dismissed_section}</main>"""
        self._write_html(HTTPStatus.OK, self._page("Artifacts", content))

    def _artifact(self, relative: str) -> None:
        requested = (self.server.artifact_root / relative).resolve()
        root = self.server.artifact_root.resolve()
        if requested == root or root not in requested.parents or not requested.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        data = requested.read_bytes()
        mime, _ = mimetypes.guess_type(requested.name)
        self._headers(HTTPStatus.OK, mime or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Content-Disposition", f'inline; filename="{requested.name}"')
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--ttl-minutes", type=int, default=60)
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        raise SystemExit(f"Artifact directory does not exist: {root}")
    key_hash = os.environ.get(KEY_HASH_ENV, "")
    generated_key = ""
    if not key_hash:
        generated_key = "sv-" + secrets.token_urlsafe(24)
        key_hash = _digest(generated_key)
    if len(key_hash) != 64:
        raise SystemExit(f"{KEY_HASH_ENV} must contain a SHA-256 digest")

    server = ReviewServer(("127.0.0.1", args.port), ReviewHandler)
    server.artifact_root = root
    server.key_hash = key_hash.lower()
    server.session_token = secrets.token_urlsafe(32)
    server.expires_at = time.time() + max(1, args.ttl_minutes) * 60
    timer = threading.Timer(max(1, args.ttl_minutes) * 60, server.shutdown)
    timer.daemon = True
    timer.start()
    print(f"StudentVoice private review portal: http://127.0.0.1:{args.port}", flush=True)
    if generated_key:
        print(f"Temporary review key: {generated_key}", flush=True)
    try:
        server.serve_forever(poll_interval=0.25)
    finally:
        timer.cancel()
        server.server_close()


if __name__ == "__main__":
    main()
