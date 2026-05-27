<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dein Anmeldecode</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
        h1 { font-size: 22px; margin-bottom: 8px; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1976d2; margin: 24px 0; text-align: center; background: #f0f4ff; padding: 16px; border-radius: 6px; }
        .btn { display: inline-block; padding: 14px 28px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; margin: 16px 0; }
        .note { color: #888; font-size: 13px; margin-top: 24px; }
    </style>
</head>
<body>
<div class="container">
    <h1>Dein Anmeldecode</h1>
    <p>Hallo {{ $recipient->name }},</p>
    <p>Klicke auf den Button, um dich sofort anzumelden, oder gib den Code manuell in der App ein.</p>

    <a class="btn" href="{{ url('/auth/verify?code=' . $plainCode . '&email=' . urlencode($recipient->email)) }}">Anmelden</a>

    <p>Oder gib diesen Code manuell ein:</p>
    <div class="code">{{ $plainCode }}</div>

    <p class="note">Dieser Code ist 15&nbsp;Minuten gültig und kann nur einmal verwendet werden.<br>
    Falls du diesen Code nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.</p>
</div>
</body>
</html>
