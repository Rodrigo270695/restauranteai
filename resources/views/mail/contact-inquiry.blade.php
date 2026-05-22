<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Nueva consulta — DiscoverLambo</title>
</head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="color: #E8001A;">Nueva consulta en DiscoverLambo</h2>
    <p><strong>Tipo:</strong> {{ $inquiry->typeLabel() }}</p>
    <p><strong>Nombre:</strong> {{ $inquiry->name }}</p>
    <p><strong>Correo:</strong> <a href="mailto:{{ $inquiry->email }}">{{ $inquiry->email }}</a></p>
    @if ($inquiry->phone)
        <p><strong>Teléfono:</strong> {{ $inquiry->phone }}</p>
    @endif
    @if ($inquiry->restaurant_name)
        <p><strong>Restaurante:</strong> {{ $inquiry->restaurant_name }}</p>
    @endif
    @if ($inquiry->district)
        <p><strong>Distrito / zona:</strong> {{ $inquiry->district }}</p>
    @endif
    <p><strong>Mensaje:</strong></p>
    <p style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 8px;">{{ $inquiry->message }}</p>
    <p style="font-size: 12px; color: #6b7280;">ID solicitud #{{ $inquiry->id }} · {{ $inquiry->created_at->format('d/m/Y H:i') }}</p>
</body>
</html>
