-- HU-20: ampliar tipos de notificación de correo
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_notificacion_check;

ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_notificacion_check
  CHECK (tipo_notificacion IN (
    'recordatorio',
    'confirmacion',
    'personalizado',
    'receta',
    'invitacion'
  ));
