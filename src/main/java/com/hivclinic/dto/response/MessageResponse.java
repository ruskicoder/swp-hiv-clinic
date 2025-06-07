package com.hivclinic.dto.response;

public class MessageResponse {
    private final boolean success;
    private final String message;

    private MessageResponse(MessageResponseBuilder builder) {
        this.success = builder.success;
        this.message = builder.message;
    }

    public static MessageResponseBuilder builder() {
        return new MessageResponseBuilder();
    }

    public static MessageResponse success(String message) {
        return builder().success(true).message(message).build();
    }

    public static MessageResponse error(String message) {
        return builder().success(false).message(message).build();
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public static class MessageResponseBuilder {
        private boolean success;
        private String message;

        public MessageResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }

        public MessageResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(this);
        }
    }
}
