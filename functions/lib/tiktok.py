"""
Intégration TikTok pour Collabzz
Gestion de l'OAuth et récupération des statistiques
"""

import os
import requests
from firebase_admin import firestore
from datetime import datetime, timedelta

# Configuration TikTok OAuth
TIKTOK_CLIENT_KEY = os.getenv('TIKTOK_CLIENT_KEY')
TIKTOK_CLIENT_SECRET = os.getenv('TIKTOK_CLIENT_SECRET')
TIKTOK_REDIRECT_URI = os.getenv('TIKTOK_REDIRECT_URI')

# URLs API TikTok
TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
TIKTOK_USER_INFO_URL = 'https://open.tiktokapis.com/v2/user/info/'


def connect_tiktok(user_id: str) -> str:
    """
    Génère l'URL d'autorisation TikTok
    
    Args:
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        URL d'autorisation OAuth
    """
    # Scopes TikTok
    scopes = [
        'user.info.basic',      # Pseudo, avatar
        'user.info.stats',      # Abonnés, likes, vidéos
        'video.list'            # Liste des vidéos
    ]
    
    # Construction de l'URL d'autorisation
    params = {
        'client_key': TIKTOK_CLIENT_KEY,
        'response_type': 'code',
        'scope': ','.join(scopes),
        'redirect_uri': TIKTOK_REDIRECT_URI,
        'state': user_id  # Passer l'user_id dans le state
    }
    
    # Construire l'URL
    query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
    authorization_url = f'{TIKTOK_AUTH_URL}?{query_string}'
    
    return authorization_url


def tiktok_callback(code: str, user_id: str) -> dict:
    """
    Callback OAuth TikTok - Récupère le token et les stats initiales
    
    Args:
        code: Code d'autorisation OAuth
        user_id: ID de l'utilisateur Firebase
        
    Returns:
        Dictionnaire avec les données de l'utilisateur
    """
    # Échanger le code contre un access token
    token_data = {
        'client_key': TIKTOK_CLIENT_KEY,
        'client_secret': TIKTOK_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': TIKTOK_REDIRECT_URI
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    token_response = requests.post(
        TIKTOK_TOKEN_URL,
        data=token_data,
        headers=headers
    )
    
    token_response.raise_for_status()
    token_json = token_response.json()
    
    if token_json.get('error'):
        raise Exception(f"TikTok OAuth error: {token_json.get('error_description')}")
    
    access_token = token_json['data']['access_token']
    refresh_token = token_json['data']['refresh_token']
    expires_in = token_json['data']['expires_in']  # Secondes
    
    # Récupérer les infos utilisateur
    user_headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    user_response = requests.get(
        TIKTOK_USER_INFO_URL,
        headers=user_headers,
        params={'fields': 'open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count,video_count'}
    )
    
    user_response.raise_for_status()
    user_json = user_response.json()
    
    if user_json.get('error'):
        raise Exception(f"TikTok User Info error: {user_json.get('error').get('message')}")
    
    user_data = user_json['data']['user']
    
    # Extraire les données
    open_id = user_data.get('open_id')
    display_name = user_data.get('display_name')
    avatar_url = user_data.get('avatar_url')
    follower_count = user_data.get('follower_count', 0)
    following_count = user_data.get('following_count', 0)
    likes_count = user_data.get('likes_count', 0)
    video_count = user_data.get('video_count', 0)
    
    # Calculer l'expiration du token
    expires_at = datetime.now() + timedelta(seconds=expires_in)
    
    # Sauvegarder dans Firestore
    db = firestore.client()
    user_ref = db.collection('influencers').document(user_id)
    
    user_ref.update({
        'socialAccounts.tiktok': {
            'connected': True,
            'openId': open_id,
            'username': display_name,
            'avatarUrl': avatar_url,
            'followers': follower_count,
            'following': following_count,
            'likes': likes_count,
            'videoCount': video_count,
            'lastUpdated': firestore.SERVER_TIMESTAMP
        },
        'tokens.tiktok': {
            'accessToken': access_token,
            'refreshToken': refresh_token,
            'expiresAt': expires_at,
            'createdAt': firestore.SERVER_TIMESTAMP
        }
    })
    
    return {
        'success': True,
        'username': display_name,
        'followers': follower_count,
        'videoCount': video_count
    }


def update_tiktok_stats(user_id: str, tokens: dict) -> dict:
    """
    Met à jour les statistiques TikTok (appelé quotidiennement)
    
    Args:
        user_id: ID de l'utilisateur Firebase
        tokens: Dictionnaire avec les tokens TikTok
        
    Returns:
        Résultat de la mise à jour
    """
    try:
        access_token = tokens.get('accessToken')
        refresh_token = tokens.get('refreshToken')
        expires_at = tokens.get('expiresAt')
        
        # Vérifier si le token a expiré
        if expires_at and datetime.now() >= expires_at.replace(tzinfo=None):
            # Rafraîchir le token
            refresh_data = {
                'client_key': TIKTOK_CLIENT_KEY,
                'client_secret': TIKTOK_CLIENT_SECRET,
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token
            }
            
            refresh_response = requests.post(
                TIKTOK_TOKEN_URL,
                data=refresh_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            refresh_response.raise_for_status()
            refresh_json = refresh_response.json()
            
            if refresh_json.get('error'):
                return {'success': False, 'error': 'Token refresh failed'}
            
            access_token = refresh_json['data']['access_token']
            refresh_token = refresh_json['data']['refresh_token']
            expires_in = refresh_json['data']['expires_in']
            expires_at = datetime.now() + timedelta(seconds=expires_in)
        
        # Récupérer les stats mises à jour
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        user_response = requests.get(
            TIKTOK_USER_INFO_URL,
            headers=headers,
            params={'fields': 'display_name,follower_count,following_count,likes_count,video_count'}
        )
        
        user_response.raise_for_status()
        user_json = user_response.json()
        
        if user_json.get('error'):
            return {'success': False, 'error': user_json.get('error').get('message')}
        
        user_data = user_json['data']['user']
        
        follower_count = user_data.get('follower_count', 0)
        following_count = user_data.get('following_count', 0)
        likes_count = user_data.get('likes_count', 0)
        video_count = user_data.get('video_count', 0)
        
        # Mettre à jour Firestore
        db = firestore.client()
        user_ref = db.collection('influencers').document(user_id)
        
        update_data = {
            'socialAccounts.tiktok.followers': follower_count,
            'socialAccounts.tiktok.following': following_count,
            'socialAccounts.tiktok.likes': likes_count,
            'socialAccounts.tiktok.videoCount': video_count,
            'socialAccounts.tiktok.lastUpdated': firestore.SERVER_TIMESTAMP
        }
        
        # Mettre à jour le token si rafraîchi
        if access_token != tokens.get('accessToken'):
            update_data['tokens.tiktok.accessToken'] = access_token
            update_data['tokens.tiktok.refreshToken'] = refresh_token
            update_data['tokens.tiktok.expiresAt'] = expires_at
        
        user_ref.update(update_data)
        
        return {
            'success': True,
            'followers': follower_count,
            'videoCount': video_count
        }
        
    except Exception as e:
        print(f"Erreur mise à jour TikTok pour {user_id}: {str(e)}")
        return {'success': False, 'error': str(e)}
