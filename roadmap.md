-verificar si hay que ocultar los salt del hasheo en el .env
-Bloquear ip cuando se ejecute limite de peticiones.




Posibles mejoras
-la peticion de getChatRequest envia en fromUser y toUser un objeto con userId, userName y publicKey, este envio de clave publica es innecesario.

-la peticion de getMessage de un chatId debemos aplicar un filtro para solo enviar los mensajes que no sean propios para ahorrar entrafico.