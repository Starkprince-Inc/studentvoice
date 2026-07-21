from datetime import datetime, timezone

from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .models import Event, Location, Source


SOURCES = [
    (
        "Unfiltered by Samdish",
        "primary_video",
        "https://www.youtube.com/watch?v=6MTXCAaOy3o",
        "Good Afternoon India — Dekh Lo Humaara 'Naya Bharat'",
    ),
    (
        "Associated Press",
        "wire_report",
        "https://apnews.com/article/india-cockroach-janta-party-sonam-wangchuk-hunger-strike-cbeb4773e89d67250f0bcad1670fcd38",
        "Thousands gather to attempt a march to Parliament",
    ),
    (
        "Hindustan Times",
        "chronology",
        "https://www.hindustantimes.com/india-news/jantar-mantar-cjp-protest-a-blow-by-blow-account-of-what-happened-on-monday-delhi-101784604090492-amp.html",
        "A blow-by-blow account of what happened",
    ),
    (
        "The Week",
        "news_report",
        "https://www.theweek.in/news/india/2026/07/20/cjp-neet-protest-jantar-mantar-parliament-march.html",
        "Police lathi-charge protesters as thousands join march",
    ),
    (
        "PTI / ThePrint",
        "official_account",
        "https://theprint.in/india/118-police-personnel-injured-70-protesters-detained-as-cjp-protest-turns-violent-in-delhi/2991722/",
        "Delhi Police statement on injuries and detentions",
    ),
    (
        "Amnesty International",
        "rights_statement",
        "https://www.amnesty.org.uk/latest/india-delhi-police-crackdown-on-peaceful-protesters-demanding-exam-justice-must-be-investigated/",
        "Police crackdown must be investigated",
    ),
    (
        "Internet Freedom Foundation",
        "digital_rights",
        "https://internetfreedom.in/iff-condemns-the-internet-shutdown-in-parts-of-central-delhi-no-suspension-order-has-been-made-public/",
        "Internet shutdown in parts of Central Delhi",
    ),
]


def seed():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(Event).where(Event.slug == "jantar-mantar-july-20")):
            return
        location = Location(
            name="Jantar Mantar", locality="New Delhi", country_code="IN", precision="locality"
        )
        db.add(location)
        db.flush()
        event = Event(
            slug="jantar-mantar-july-20",
            title_en="Jantar Mantar ‘Chalo Sansad’ protest",
            title_hi="जंतर मंतर ‘चलो संसद’ प्रदर्शन",
            description="A versioned source register and claim ledger for the July 20, 2026 protest.",
            occurred_at=datetime(2026, 7, 20, tzinfo=timezone.utc),
            location_id=location.id,
            public=True,
        )
        db.add(event)
        db.flush()
        for publisher, source_type, url, title in SOURCES:
            db.add(
                Source(
                    event_id=event.id,
                    publisher=publisher,
                    source_type=source_type,
                    url=url,
                    title=title,
                    rights_basis="link_only",
                )
            )
        db.commit()


if __name__ == "__main__":
    seed()
