"""
TikTok API v2 – Intégration propre pour Collabzz
OAuth + récupération des statistiques utilisateur
"""

import os
import requests
from urllib.parse import urlencode
from datetime import datetime, timedelta
from firebase_admin import firestore
from lib.token_store import save_tokens

# ========================
# CONFIGURATION
# ========================

TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
TIKTOK_REDIRECT_URI = os.getenv("TIKTOK_REDIRECT_URI")

TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"

# ========================
# OAUTH – CONNEXION
# ========================

def connect_tiktok(user_id: str, state_token: str) -> str:
    scopes = [
        "user.info.basic",
        "user.info.stats",
        "video.list"
    ]

    params = {
        "client_key": TIKTOK_CLIENT_KEY,
        "response_type": "code",
        "scope": ",".join(scopes),
        "redirect_uri": TIKTOK_REDIRECT_URI,
        "state": state_token
    }

    return f"{TIKTOK_AUTH_URL}?{urlencode(params)}"


# ========================
# CALLBACK OAUTH
# ========================

def tiktok_callback(code: str, user_id: str) -> dict:
    token_payload = {
        "client_key": TIKTOK_CLIENT_KEY,
        "client_secret": TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": TIKTOK_REDIRECT_URI
    }

    token_res = requests.post(
        TIKTOK_TOKEN_URL,
        data=token_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_res.raise_for_status()
    token = token_res.json()

    access_token = token.get("access_token")
    refresh_token = token.get("refresh_token")
    expires_in = token.get("expires_in", 3600)
    open_id = token.get("open_id")

    if not access_token:
        raise Exception(f"Token TikTok invalide : {token}")

    # ========================
    # RÉCUPÉRATION STATS
    # ========================

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    user_res = requests.get(
        TIKTOK_USER_INFO_URL,
        headers=headers,
        params={"fields": "statistics"}
    )
    user_res.raise_for_status()
    user_json = user_res.json()

    user = user_json["data"]["user"]
    stats = user.get("statistics", {})

    followers = stats.get("follower_count", 0)
    following = stats.get("following_count", 0)
    likes = stats.get("likes_count", 0)
    videos = stats.get("video_count", 0)

    # ========================
    # SAUVEGARDE FIRESTORE
    # ========================

    db = firestore.client()
    db.collection("influencers").document(user_id).update({
        "socialAccounts.tiktok": {
            "connected": True,
            "openId": open_id,
            "followers": followers,
            "following": following,
            "likes": likes,
            "videoCount": videos,
            "lastUpdated": firestore.SERVER_TIMESTAMP
        }
    })

    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    save_tokens(user_id, "tiktok", {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "expiresAt": expires_at,
        "createdAt": firestore.SERVER_TIMESTAMP
    })

    return {
        "success": True,
        "followers": followers,
        "following": following,
        "likes": likes,
        "videoCount": videos
    }


# ========================
# UPDATE STATS (CRON)
# ========================

def update_tiktok_stats(user_id: str, tokens: dict) -> dict:
    access_token = tokens["accessToken"]
    refresh_token = tokens["refreshToken"]
    expires_at = tokens["expiresAt"]

    # Rafraîchir le token si nécessaire
    if datetime.utcnow() >= expires_at.replace(tzinfo=None):
        refresh_payload = {
            "client_key": TIKTOK_CLIENT_KEY,
            "client_secret": TIKTOK_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }

        refresh_res = requests.post(
            TIKTOK_TOKEN_URL,
            data=refresh_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        refresh_res.raise_for_status()
        refreshed = refresh_res.json()

        access_token = refreshed["access_token"]
        refresh_token = refreshed["refresh_token"]
        expires_at = datetime.utcnow() + timedelta(
            seconds=refreshed["expires_in"]
        )

        save_tokens(user_id, "tiktok", {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "expiresAt": expires_at,
            "updatedAt": firestore.SERVER_TIMESTAMP
        })

    # Récupération stats
    headers = {"Authorization": f"Bearer {access_token}"}
    res = requests.get(
        TIKTOK_USER_INFO_URL,
        headers=headers,
        params={"fields": "statistics"}
    )
    res.raise_for_status()

    stats = res.json()["data"]["user"].get("statistics", {})

    db = firestore.client()
    db.collection("influencers").document(user_id).update({
        "socialAccounts.tiktok.followers": stats.get("follower_count", 0),
        "socialAccounts.tiktok.following": stats.get("following_count", 0),
        "socialAccounts.tiktok.likes": stats.get("likes_count", 0),
        "socialAccounts.tiktok.videoCount": stats.get("video_count", 0),
        "socialAccounts.tiktok.lastUpdated": firestore.SERVER_TIMESTAMP
    })

    return {"success": True}
