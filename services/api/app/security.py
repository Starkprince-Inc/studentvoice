import base64
import json
from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from .config import get_settings


@dataclass(frozen=True)
class Actor:
    id: str
    role: str


ROLE_ORDER = {"submitter": 0, "reviewer": 1, "editor": 2, "legal": 2, "admin": 3}


def _from_azure_principal(encoded: str) -> Actor:
    try:
        payload = json.loads(base64.b64decode(encoded).decode("utf-8"))
        claims = payload.get("claims", [])
        claim_map = {item.get("typ"): item.get("val") for item in claims}
        actor_id = payload.get("userDetails") or claim_map.get("name") or claim_map.get("preferred_username")
        role = claim_map.get("roles") or "submitter"
        if not actor_id or role not in ROLE_ORDER:
            raise ValueError("principal missing supported identity or role")
        return Actor(str(actor_id), str(role))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Azure principal"
        ) from exc


def get_actor(
    x_ms_client_principal: str | None = Header(default=None),
    x_demo_actor: str | None = Header(default=None),
    x_demo_role: str | None = Header(default=None),
) -> Actor:
    if x_ms_client_principal:
        return _from_azure_principal(x_ms_client_principal)
    if get_settings().environment != "production" and x_demo_actor and x_demo_role in ROLE_ORDER:
        return Actor(x_demo_actor, x_demo_role)
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def require_role(actor: Actor, *roles: str) -> None:
    if actor.role not in roles and actor.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=f"Required role: {', '.join(roles)}"
        )
