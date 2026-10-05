package com.crimelens.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Controller
@Slf4j
public class WebSocketController {

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        log.info("New WebSocket connection: {}", event.getUser() != null ? event.getUser().getName() : "Anonymous");
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        log.info("WebSocket disconnected: {}", event.getUser() != null ? event.getUser().getName() : "Anonymous");
    }
}
