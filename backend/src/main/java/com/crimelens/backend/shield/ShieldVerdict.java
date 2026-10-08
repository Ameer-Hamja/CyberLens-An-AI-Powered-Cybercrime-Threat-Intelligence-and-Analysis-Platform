package com.crimelens.backend.shield;
import java.util.List;
public record ShieldVerdict(String verdict, int score, List<String> reasons, String category) {
    public static ShieldVerdict of(int score, List<String> reasons, String category) {
        int bounded = Math.max(0, Math.min(100, score));
        return new ShieldVerdict(bounded >= 70 ? "DANGEROUS" : bounded >= 30 ? "SUSPICIOUS" : "SAFE", bounded, List.copyOf(reasons), category);
    }
}
