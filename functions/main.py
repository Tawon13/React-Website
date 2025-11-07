"""
Cloud Functions pour Collabzz
Intégration YouTube et TikTok avec OAuth et mise à jour automatique
"""

import os
from firebase_functions import https_fn, scheduler_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, firestore
from dotenv import load_dotenv

# Charger les variables d'environnement (pour le développement local)
load_dotenv()

# Initialiser Firebase Admin
initialize_app()

# Importer les modules YouTube et TikTok
from lib.youtube import connect_youtube, youtube_callback, update_youtube_stats
from lib.tiktok import connect_tiktok, tiktok_callback, update_tiktok_stats

# Configuration globale
set_global_options(max_instances=10)


# ============================================
# ROUTES HTTP - OAuth YouTube
# ============================================

@https_fn.on_request()
def youtube_connect(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 1 : Redirige vers l'autorisation YouTube
    URL: /youtube_connect?userId=xxx
    """
    # Ajouter CORS headers
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return https_fn.Response('', status=204, headers=headers)
    
    user_id = req.args.get('userId')
    
    if not user_id:
        return https_fn.Response('Missing userId parameter', status=400)
    
    try:
        auth_url = connect_youtube(user_id)
        # Rediriger vers YouTube
        return https_fn.Response(
            status=302,
            headers={'Location': auth_url}
        )
    except Exception as e:
        print(f'Erreur youtube_connect: {str(e)}')
        return https_fn.Response(f'Error: {str(e)}', status=500)


@https_fn.on_request()
def youtube_callback_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 2 : Callback après autorisation YouTube
    URL: /youtube_callback?code=xxx&state=userId
    """
    # CORS headers
    headers = {'Access-Control-Allow-Origin': '*'}
    
    code = req.args.get('code')
    state = req.args.get('state')  # user_id
    
    if not code or not state:
        return https_fn.Response('Missing code or state', status=400)
    
    try:
        result = youtube_callback(code, state)
        
        # Retourner une page HTML qui ferme la popup et notifie le parent
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Connecté</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    color: #333;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>YouTube Connecté !</h1>
                <p><strong>{result['channelName']}</strong></p>
                <p>{result['subscribers']:,} abonnés • {result['videoCount']} vidéos</p>
                <p style="color: #666; margin-top: 20px;">Cette fenêtre va se fermer...</p>
            </div>
            <script>
                // Notifier la fenêtre parente
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'youtube-connected',
                        data: {result}
                    }}, '*');
                }}
                // Fermer la popup après 2 secondes
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """
        
        return https_fn.Response(html, headers={
            'Content-Type': 'text/html; charset=utf-8'
        })
        
    except Exception as e:
        print(f'Erreur youtube_callback: {str(e)}')
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>{str(e)}</p>
            <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        """
        return https_fn.Response(html, status=500, headers={'Content-Type': 'text/html'})


# ============================================
# ROUTES HTTP - OAuth TikTok
# ============================================

@https_fn.on_request()
def tiktok_connect(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 1 : Redirige vers l'autorisation TikTok
    URL: /tiktok_connect?userId=xxx
    """
    # CORS
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return https_fn.Response('', status=204, headers=headers)
    
    user_id = req.args.get('userId')
    
    if not user_id:
        return https_fn.Response('Missing userId parameter', status=400)
    
    try:
        auth_url = connect_tiktok(user_id)
        print(f'TikTok auth URL generated: {auth_url}')
        # Rediriger vers TikTok
        return https_fn.Response(
            status=302,
            headers={'Location': auth_url}
        )
    except Exception as e:
        print(f'Erreur tiktok_connect: {str(e)}')
        import traceback
        traceback.print_exc()
        return https_fn.Response(f'Error: {str(e)}', status=500)


@https_fn.on_request()
def tiktok_callback_handler(req: https_fn.Request) -> https_fn.Response:
    """
    Étape 2 : Callback après autorisation TikTok
    URL: /tiktok_callback?code=xxx&state=userId
    """
    # CORS headers
    headers = {'Access-Control-Allow-Origin': '*'}
    
    code = req.args.get('code')
    state = req.args.get('state')  # user_id
    
    if not code or not state:
        return https_fn.Response('Missing code or state', status=400)
    
    try:
        result = tiktok_callback(code, state)
        
        # Page HTML de succès
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TikTok Connecté</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #000000 0%, #fe2c55 100%);
                    color: white;
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    color: #333;
                }}
                .success-icon {{
                    font-size: 64px;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>TikTok Connecté !</h1>
                <p><strong>@{result['username']}</strong></p>
                <p>{result['followers']:,} abonnés • {result['videoCount']} vidéos</p>
                <p style="color: #666; margin-top: 20px;">Cette fenêtre va se fermer...</p>
            </div>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        type: 'tiktok-connected',
                        data: {result}
                    }}, '*');
                }}
                setTimeout(() => window.close(), 2000);
            </script>
        </body>
        </html>
        """
        
        return https_fn.Response(html, headers={
            'Content-Type': 'text/html; charset=utf-8'
        })
        
    except Exception as e:
        print(f'Erreur tiktok_callback: {str(e)}')
        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1 style="color: red;">❌ Erreur</h1>
            <p>{str(e)}</p>
            <button onclick="window.close()">Fermer</button>
        </body>
        </html>
        """
        return https_fn.Response(html, status=500, headers={'Content-Type': 'text/html'})


# ============================================
# FONCTION PLANIFIÉE - Mise à jour quotidienne
# ============================================

@scheduler_fn.on_schedule(schedule="0 2 * * *", timezone="Europe/Paris")
def daily_stats_update(event: scheduler_fn.ScheduledEvent) -> None:
    """
    Mise à jour quotidienne des statistiques YouTube et TikTok
    S'exécute tous les jours à 2h du matin (heure de Paris)
    """
    print("🚀 Début de la mise à jour quotidienne des stats")
    
    db = firestore.client()
    
    # Récupérer tous les influenceurs avec au moins un compte connecté
    influencers = db.collection('influencers').stream()
    
    update_count = 0
    error_count = 0
    
    for influencer in influencers:
        user_id = influencer.id
        data = influencer.to_dict()
        
        social_accounts = data.get('socialAccounts', {})
        tokens = data.get('tokens', {})
        
        # Mettre à jour YouTube si connecté
        if social_accounts.get('youtube', {}).get('connected'):
            youtube_tokens = tokens.get('youtube', {})
            if youtube_tokens:
                print(f"📺 Mise à jour YouTube pour {user_id}")
                result = update_youtube_stats(user_id, youtube_tokens)
                if result.get('success'):
                    update_count += 1
                    print(f"✅ YouTube mis à jour: {result.get('subscribers')} abonnés")
                else:
                    error_count += 1
                    print(f"❌ Erreur YouTube: {result.get('error')}")
        
        # Mettre à jour TikTok si connecté
        if social_accounts.get('tiktok', {}).get('connected'):
            tiktok_tokens = tokens.get('tiktok', {})
            if tiktok_tokens:
                print(f"🎵 Mise à jour TikTok pour {user_id}")
                result = update_tiktok_stats(user_id, tiktok_tokens)
                if result.get('success'):
                    update_count += 1
                    print(f"✅ TikTok mis à jour: {result.get('followers')} abonnés")
                else:
                    error_count += 1
                    print(f"❌ Erreur TikTok: {result.get('error')}")
    
    print(f"✨ Mise à jour terminée: {update_count} succès, {error_count} erreurs")
