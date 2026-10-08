package com.crimelens.backend.shield;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
class UrlHeuristicsTest {
 @ParameterizedTest @CsvSource({
  "https://www.paypal.com,0", "https://login.paypal.com,0", "https://paypal.com.attacker.test/login-verify,85",
  "https://paypa1.test/login-verify,85", "http://sbi-verify.test/update-kyc,100", "https://xn--pple-43d.test,95",
  "http://192.0.2.10/login-verify,90", "https://example.zip/claim-prize,45", "https://paypal.com@evil.test/login-verify,55",
  "https://hdfc-support.test,60", "https://example.com,0", "http://example.test,30", "http://www.dghjdgf.com/paypal.co.uk/cyc,90", "https://example.test/paypal.co.uk/cyc,60"})
 void signals(String url,int score){assertEquals(score,UrlHeuristics.analyze(url).score());}
 @Test void invalidInputs(){for(String input:new String[]{"javascript:alert(1)","file:///etc/passwd","https://","not a url"})assertThrows(org.springframework.web.server.ResponseStatusException.class,()->UrlHeuristics.analyze(input));}
 @Test void unicodeHost(){assertTrue(UrlHeuristics.host("https://аpple.test").startsWith("xn--"));}
 @Test void longUrl(){assertEquals(15,UrlHeuristics.analyze("https://example.com/"+"a".repeat(200)).score());}
 @Test void verdictBounds(){assertEquals("DANGEROUS",ShieldVerdict.of(150,java.util.List.of(),"OTHER").verdict());assertEquals(0,ShieldVerdict.of(-1,java.util.List.of(),"OTHER").score());}
}
