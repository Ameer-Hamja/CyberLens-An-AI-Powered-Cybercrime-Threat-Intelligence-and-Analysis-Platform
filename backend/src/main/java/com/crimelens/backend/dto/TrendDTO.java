package com.crimelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrendDTO implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private LocalDate date;
    private String threatType;
    private Long count;
}
