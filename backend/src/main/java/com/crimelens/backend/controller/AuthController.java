package com.crimelens.backend.controller;

import com.crimelens.backend.config.JwtUtil;
import com.crimelens.backend.dto.ApiResponse;
import com.crimelens.backend.dto.LoginRequestDTO;
import com.crimelens.backend.dto.LoginResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * PUBLIC ENDPOINTS (no auth required):
 * GET  /api/threats/live              → paginated threat feed
 * GET  /api/threats/live?threatType=  → filtered by type
 * GET  /api/threats/live?minSeverity= → filtered by severity
 * GET  /api/threats/heatmap           → India state threat map
 * GET  /api/threats/trends            → 30-day trend data
 * GET  /api/threats/trends?days=N     → N-day trend data
 * GET  /api/threats/search?q=         → full-text search
 * GET  /api/threats/{id}              → single threat
 * GET  /api/threats/recent/{type}     → recent by threat type
 * GET  /api/threats/summary           → type distribution
 * POST /api/threats/subscribe         → email subscription
 * DEL  /api/threats/unsubscribe       → remove subscription
 * POST /api/scan                      → scan text/URL/UPI
 * POST /api/scan/image                → scan image
 * GET  /api/scan/history              → anonymized scan stats
 * GET  /api/stats                     → platform statistics
 * GET  /api/stats/realtime            → last 5 min stats
 * GET  /api/stats/by-type             → stats per threat type
 * GET  /api/stats/by-state            → stats per state
 * GET  /api/health                    → system health check
 * POST /api/auth/login                → get JWT token
 * GET  /api/auth/validate             → validate token
 * POST /api/auth/logout               → logout (stateless)
 *
 * WEBSOCKET ENDPOINTS:
 * WS   /ws                            → connect (SockJS)
 * SUB  /topic/threats                 → live threat feed
 * SUB  /topic/stats                   → live stats updates
 * PUB  /app/subscribe                 → join threat feed
 *
 * ADMIN ENDPOINTS (JWT ROLE_ADMIN required):
 * GET  /api/admin/dashboard           → admin overview
 * DEL  /api/admin/threats/{id}        → delete threat
 * POST /api/admin/cache/evict         → clear Redis cache
 * GET  /api/admin/subscriptions       → list subscriptions
 * POST /api/admin/ingest/trigger      → manual test ingest
 * GET  /api/admin/dedup/stats         → bloom filter stats
 *
 * ACTUATOR ENDPOINTS:
 * GET  /actuator/health               → Spring health
 * GET  /actuator/prometheus           → Prometheus metrics
 * GET  /actuator/info                 → app info
 * GET  /swagger-ui.html               → API documentation
 * GET  /v3/api-docs                   → OpenAPI JSON spec
 */
@RestController
@RequestMapping("/api/auth")
@Slf4j
@Tag(name = "Authentication")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    // UserDetailsService and PasswordEncoder might be needed if custom login logic is added later
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "Login and get JWT token")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));
                            
            String token = jwtUtil.generateToken(request.getUsername());
            
            LoginResponseDTO response = new LoginResponseDTO(
                    token,
                    Instant.now().plusMillis(86400000).toString(),
                    request.getUsername(),
                    "ADMIN"
            );
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for username: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        }
    }

    @Operation(summary = "Validate existing JWT token")
    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<String>> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                return ResponseEntity.ok(ApiResponse.success("Token valid"));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Token invalid or expired"));
    }

    @Operation(summary = "Logout user")
    @PostMapping("/logout")
    public ApiResponse<String> logout() {
        // Stateless JWT — no server-side invalidation needed
        // Future enhancement: Add token to Redis blacklist
        return ApiResponse.success("Logged out. Please discard your token.");
    }
}
