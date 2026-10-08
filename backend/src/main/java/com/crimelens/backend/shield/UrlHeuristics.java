package com.crimelens.backend.shield;
import java.net.URI;
import java.net.IDN;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public final class UrlHeuristics {
    private UrlHeuristics() {}
    private static final Map<String,List<String>> BRANDS = Map.of(
        "paypal",List.of("paypal.com"), "sbi",List.of("sbi.co.in","onlinesbi.sbi"),
        "hdfc",List.of("hdfcbank.com"), "icici",List.of("icicibank.com"),
        "google",List.of("google.com"), "microsoft",List.of("microsoft.com","live.com","office.com"),
        "amazon",List.of("amazon.in","amazon.com"), "apple",List.of("apple.com","icloud.com"));
    public static String host(String value) {
        try {
            URI uri = URI.create(value.trim());
            if (!Set.of("http","https").contains(String.valueOf(uri.getScheme()).toLowerCase(Locale.ROOT)) || uri.getRawAuthority() == null) throw new IllegalArgumentException();
            String authority=uri.getRawAuthority();
            authority=authority.substring(authority.lastIndexOf('@')+1);
            String host=authority.startsWith("[") ? authority.substring(1,authority.indexOf(']')) : authority.split(":",2)[0];
            host=host.replaceAll("\\.$", "");
            if(host.isBlank()) throw new IllegalArgumentException();
            return host.contains(":") ? host.toLowerCase(Locale.ROOT) : IDN.toASCII(host,IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
        } catch (RuntimeException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Provide an absolute HTTP or HTTPS URL with a valid host"); }
    }
    public static ShieldVerdict analyze(String value) {
        String host=host(value), lower=value.trim().toLowerCase(Locale.ROOT); int score=0; List<String> reasons=new ArrayList<>();
        if(lower.startsWith("http:")){score+=30;reasons.add("HTTP does not encrypt this connection; do not enter sensitive information");}
        if(host.contains("xn--")){score+=35;reasons.add("Internationalized domain uses punycode; verify its spelling");}
        if(host.matches("\\d{1,3}(\\.\\d{1,3}){3}") || host.contains(":")){score+=35;reasons.add("URL uses an IP address instead of a domain");}
        if(host.matches(".*\\.(zip|mov|click|top|xyz|work|gq|tk|cf|buzz)$")){score+=20;reasons.add("Domain uses a TLD frequently associated with suspicious campaigns");}
        if(value.length()>180){score+=15;reasons.add("Unusually long URL can conceal its destination");}
        if(URI.create(value).getRawUserInfo()!=null){score+=30;reasons.add("Embedded username can disguise the actual destination");}
        for(var brand:BRANDS.entrySet()) {
            if(brand.getValue().stream().anyMatch(official->host.equals(official)||host.endsWith("."+official))) continue;
            boolean resembles=Arrays.stream(host.split("[.\\-]")).anyMatch(label->label.contains(brand.getKey()) || (label.length()>=4 && distance(label,brand.getKey())<=1));
            String path=Optional.ofNullable(URI.create(value.trim()).getPath()).orElse("").toLowerCase(Locale.ROOT);
            boolean disguised=PatternHolder.brandDomain(path,brand.getKey());
            if(resembles || disguised){score+=60;reasons.add("Possible "+brand.getKey()+" brand impersonation or typosquatting");break;}
        }
        if(lower.matches(".*(verify[-_/]?account|login[-_/]?verify|claim[-_/]?prize|share[-_/]?otp|update[-_/]?kyc).*")){score+=25;reasons.add("URL contains account-verification or reward bait");}
        return ShieldVerdict.of(score,reasons,"PHISHING");
    }
    private static final class PatternHolder {
        static boolean brandDomain(String path,String brand){return java.util.regex.Pattern.compile("(?:^|[^a-z0-9])"+brand+"\\.(?:com|co\\.[a-z]{2}|[a-z]{2})(?:[^a-z0-9]|$)").matcher(path).find();}
    }
    static int distance(String a,String b){int[] row=new int[b.length()+1];for(int j=0;j<row.length;j++)row[j]=j;for(int i=1;i<=a.length();i++){int prev=row[0];row[0]=i;for(int j=1;j<=b.length();j++){int old=row[j];row[j]=Math.min(Math.min(row[j]+1,row[j-1]+1),prev+(a.charAt(i-1)==b.charAt(j-1)?0:1));prev=old;}}return row[b.length()];}
}
