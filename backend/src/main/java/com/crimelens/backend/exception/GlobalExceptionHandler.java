package com.crimelens.backend.exception;

import com.crimelens.backend.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.dao.DataIntegrityViolationException;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handle(Exception ex) {
        int status = 500;
        String message = "An unexpected error occurred";
        if (ex instanceof MethodArgumentNotValidException validation) {
            status = 400;
            message = validation.getBindingResult().getFieldErrors().stream()
                    .map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .collect(java.util.stream.Collectors.joining(", "));
        } else if (ex instanceof org.springframework.http.converter.HttpMessageNotReadableException) {
            status = 400; message = "Malformed JSON request";
        } else if (ex instanceof org.springframework.web.multipart.MaxUploadSizeExceededException) {
            status = 413; message = "File too large";
        } else if (ex instanceof org.springframework.web.method.annotation.MethodArgumentTypeMismatchException) {
            status = 400; message = "Invalid request parameter type";
        } else if (ex instanceof ErrorResponse error) {
            status = error.getStatusCode().value();
            message = error.getBody().getDetail();
        } else if (ex instanceof EntityNotFoundException) {
            status = 404; message = "Requested record was not found";
        } else if (ex instanceof AccessDeniedException) {
            status = 403; message = "Access denied";
        } else if (ex instanceof AuthenticationException) {
            status = 401; message = "Authentication required";
        } else if (ex instanceof RateLimitExceededException) {
            status = 429; message = ex.getMessage();
        } else if (ex instanceof DataIntegrityViolationException) {
            status = 409; message = "The request conflicts with an existing record";
        } else if (ex instanceof IllegalArgumentException || ex instanceof jakarta.validation.ConstraintViolationException) {
            status = 400; message = "Invalid request parameters";
        }
        if (status >= 500) log.error("Request failed", ex);
        return ResponseEntity.status(status).body(ApiResponse.error(message == null ? "Request failed" : message));
    }
}
