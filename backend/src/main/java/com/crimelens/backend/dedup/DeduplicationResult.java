package com.crimelens.backend.dedup;

import lombok.Value;

@Value
public class DeduplicationResult {
    boolean accepted;
    String contentHash;

    public static DeduplicationResult accepted(String hash) {
        return new DeduplicationResult(true, hash);
    }

    public static DeduplicationResult duplicate(String hash) {
        return new DeduplicationResult(false, hash);
    }
}
