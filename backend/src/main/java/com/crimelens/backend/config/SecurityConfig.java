package com.crimelens.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET,
                    "/api/alerts/recent", "/api/incidents/**", "/api/threats/**", "/api/stats/**", "/api/health",
                    "/api/auth/**", "/api/scan/history",
                    "/ws/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**",
                    "/actuator/health", "/actuator/prometheus").permitAll()
                .requestMatchers(HttpMethod.POST,
                    "/api/scan", "/api/scan/image", "/api/scan/url", "/api/scan/text",
                    "/api/threats/subscribe",
                    "/api/auth/register", "/api/auth/login", "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.DELETE,
                    "/api/threats/unsubscribe").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/reports").authenticated()
                .anyRequest().hasRole("ADMIN")
            )
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, error) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, error) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":\"Access denied\"}");
                }))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder,
            com.crimelens.backend.repository.AppUserRepository users,
            @Value("${ADMIN_PASSWORD}") String adminPassword) {
        return username -> {
            if ("admin".equals(username)) {
                return User.withUsername("admin").password(passwordEncoder.encode(adminPassword)).roles("ADMIN").build();
            }
            var user = users.findById(username).orElseThrow(() ->
                    new org.springframework.security.core.userdetails.UsernameNotFoundException(username));
            return User.withUsername(user.getUsername()).password(user.getPasswordHash()).roles(user.getRole()).build();
        };
    }
}
