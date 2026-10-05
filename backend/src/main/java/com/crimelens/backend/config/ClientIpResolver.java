package com.crimelens.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ClientIpResolver {
    private final Set<String> trustedProxies;
    public ClientIpResolver(@Value("${app.trusted-proxies:}") String proxies) {
        trustedProxies = Arrays.stream(proxies.split(",")).map(String::trim).filter(value -> !value.isEmpty()).collect(Collectors.toSet());
    }
    public String resolve(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Real-IP");
        if (trustedProxies.contains(remote) && forwarded != null && forwarded.matches("[0-9a-fA-F:.]{3,45}")) return forwarded;
        return remote;
    }
}
