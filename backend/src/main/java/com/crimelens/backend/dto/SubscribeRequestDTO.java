package com.crimelens.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class SubscribeRequestDTO {
    @NotBlank
    @Email
    private String email;
    private List<String> states;
    private List<String> threatTypes;
}
