package moe.dituon.petpet.server;

import moe.dituon.petpet.share.BaseConfigFactory;
import moe.dituon.petpet.share.TextExtraData;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class GETParser extends RequestParser {
    HashMap<String, String> parameterList = new HashMap<>();
    private final ServerPetService service;
    public GETParser(ServerPetService service, String param) {
        this.service = service;
        String[] queryList = param.split("&");
        for (String query : queryList) {
            String[] parameter = query.split("=");
            if (parameter.length != 2) continue;
            parameterList.put(parameter[0], URLDecoder.decode(parameter[1], StandardCharsets.UTF_8));
        }
        parser();
    }

    private void parser() {
        List<String> textList = get("textList") != null ?
                Arrays.asList(get("textList").split("\\s+")) : Collections.emptyList();

        String randomAvatarListStr = get("randomAvatarList");

        super.imagePair = service.generateImage(
                get("key"),
                BaseConfigFactory.getGifAvatarExtraDataFromUrls(
                        get("fromAvatar"), get("toAvatar"), get("groupAvatar"), get("botAvatar"),
                        get("randomAvatarList") != null ? List.of(randomAvatarListStr.split(",")) : null
                ), new TextExtraData(
                        get("fromName") != null ? get("fromName") : "from",
                        get("toName") != null ? get("toName") : "to",
                        get("groupName") != null ? get("groupName") : "group",
                        textList
                ), null
        );
    }

    private String get(String key) {
        return parameterList.get(key);
    }

    @Override
    public void close(){
        super.imagePair = null;
        parameterList = null;
    }
}
