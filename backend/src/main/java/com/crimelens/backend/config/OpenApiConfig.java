package com.crimelens.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI crimelensOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CrimeLens API")
                        .description("Real-Time Cybercrime Intelligence Platform API " +
                                "for India. Provides threat intelligence, " +
                                "citizen scanner, and live dashboard data.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CrimeLens Team")
                                .email("api@crimelens.in"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .addSecurityItem(new SecurityRequirement()
                        .addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token obtained from /api/auth/login")))
                .externalDocs(new ExternalDocumentation()
                        .description("CrimeLens Documentation")
                        .url("https://docs.crimelens.in"));
    }
}
