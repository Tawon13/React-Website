"""
Helper utilities to store OAuth tokens in a server-only collection.
"""

from firebase_admin import firestore

TOKENS_COLLECTION = 'oauthTokens'


def save_tokens(user_id: str, platform: str, token_payload: dict) -> None:
    """
    Persist tokens for a given user/platform combination.
    Tokens are stored in the oauthTokens collection and are not exposed to clients.
    """
    db = firestore.client()
    doc_ref = db.collection(TOKENS_COLLECTION).document(user_id)
    doc_ref.set({
        platform: token_payload,
        'updatedAt': firestore.SERVER_TIMESTAMP
    }, merge=True)


def get_user_tokens(user_id: str) -> dict:
    """Fetch all tokens stored for a user."""
    db = firestore.client()
    snapshot = db.collection(TOKENS_COLLECTION).document(user_id).get()
    if not snapshot.exists:
        return {}
    return snapshot.to_dict() or {}


def delete_tokens(user_id: str, platform: str) -> None:
    """Remove tokens for a given platform."""
    db = firestore.client()
    doc_ref = db.collection(TOKENS_COLLECTION).document(user_id)
    doc_ref.set({
        platform: firestore.DELETE_FIELD
    }, merge=True)
