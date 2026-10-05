package com.crimelens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanRequestDTO {
    @NotBlank
    private String inputText;
}
