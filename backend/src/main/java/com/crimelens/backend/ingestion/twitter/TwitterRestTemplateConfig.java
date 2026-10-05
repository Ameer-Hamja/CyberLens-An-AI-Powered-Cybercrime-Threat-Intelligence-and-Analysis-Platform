package com.crimelens.backend.ingestion.twitter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class TwitterRestTemplateConfig {

    @Value("${ingestion.twitter.bearerToken:}")
    private String bearerToken;

    @Bean("twitterRestTemplate")
    public RestTemplate twitterRestTemplate(RestTemplateBuilder builder) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);

        ClientHttpRequestInterceptor interceptor = (request, body, execution) -> {
            if (bearerToken != null && !bearerToken.isEmpty()) {
                request.getHeaders().add("Authorization", "Bearer " + bearerToken);
            }
            return execution.execute(request, body);
        };

        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .additionalInterceptors(interceptor)
                .messageConverters(converter)
                .build();
    }
}
