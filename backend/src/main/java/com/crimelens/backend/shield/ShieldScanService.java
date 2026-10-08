package com.crimelens.backend.shield;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.PageRequest;
import com.crimelens.backend.repository.ThreatRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;
@Service @RequiredArgsConstructor @Slf4j
public class ShieldScanService {
    private final StringRedisTemplate redis; private final RestTemplate restTemplate; private final ObjectMapper mapper; private final ThreatRepository threats;
    @Value("${ai.service.url}") private String aiUrl;
    private volatile Set<String> badDomains=Set.of(); private volatile long domainsExpire=0;
    public ShieldVerdict scan(String value,boolean url){
        ShieldVerdict local=url?UrlHeuristics.analyze(value):ShieldVerdict.of(0,List.of(),"OTHER");
        String key="shield:url:v2:"+ShieldRateLimiter.hash(value.trim());
        if(url)try{String cached=redis.opsForValue().get(key);if(cached!=null)return mapper.readValue(cached,ShieldVerdict.class);}catch(Exception e){log.warn("Shield cache read unavailable");}
        int score=local.score();List<String> reasons=new ArrayList<>(local.reasons());String category=local.category();boolean degraded=false;
        if(url && knownBad(UrlHeuristics.host(value))){score=100;reasons.add("Domain matches a high-severity ingested incident");}
        try {
            Map<?,?> body=restTemplate.postForObject(aiUrl+(url?"/scan/url":"/scan/text"),Map.of(url?"url":"text",value),Map.class);
            if(body==null||!(body.get("data") instanceof Map<?,?> data))throw new IllegalStateException("Missing classification");
            int ai=((Number)data.get("score")).intValue();score=Math.max(score,ai);
            if(data.get("reasons") instanceof List<?> list)list.forEach(reason->reasons.add(String.valueOf(reason)));
            if(ai>=local.score())category=String.valueOf(data.get("category"));
        }catch(Exception e){degraded=true;score=Math.max(score,30);reasons.add("AI service unavailable; result uses local checks and cannot confirm safety");log.warn("Shield AI classification unavailable");}
        if(reasons.isEmpty())reasons.add("No warning signals found; this is not a guarantee of safety");
        ShieldVerdict result=ShieldVerdict.of(score,reasons.stream().distinct().toList(),category);
        if(url)try{redis.opsForValue().set(key,mapper.writeValueAsString(result),Duration.ofSeconds(degraded?30:600));}catch(Exception e){log.warn("Shield cache write unavailable");}
        return result;
    }
    private boolean knownBad(String host){
        if(System.currentTimeMillis()>domainsExpire){synchronized(this){if(System.currentTimeMillis()>domainsExpire){Set<String> next=new HashSet<>();try{for(String text:threats.findHighSeverityTexts(PageRequest.of(0,1000))){var matcher=Pattern.compile("https?://[^\\s<>\\\"']+").matcher(text);while(matcher.find())try{String candidate=UrlHeuristics.host(matcher.group().replaceAll("[),.;]+$",""));if(!candidate.endsWith(".invalid")&&!candidate.endsWith(".gov.in")&&!candidate.equals("cert-in.org.in"))next.add(candidate);}catch(Exception ignored){}}badDomains=Set.copyOf(next);domainsExpire=System.currentTimeMillis()+120000;}catch(Exception e){log.warn("Shield incident domain lookup unavailable");domainsExpire=System.currentTimeMillis()+10000;}}}}
        return badDomains.stream().anyMatch(domain->host.equals(domain)||host.endsWith("."+domain));
    }
}
