package com.crimelens.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ScanRequestDTO {
    @NotBlank
    @jakarta.validation.constraints.Size(min = 3, max = 2000)
    private String inputText;
}
