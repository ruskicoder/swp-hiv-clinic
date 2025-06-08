package com.hivclinic.dto.response;

public class MessageResponse {
    private final boolean success;
    private final String message;
    private final Object data;

    private MessageResponse(MessageResponseBuilder builder) {
        this.success = builder.success;
        this.message = builder.message;
        this.data = builder.data;
    }

    public static MessageResponseBuilder builder() {
        return new MessageResponseBuilder();
    }

    public static MessageResponse success(String message) {
        return builder().success(true).message(message).build();
    }

    public static MessageResponse success(String message, Object data) {
        return builder().success(true).message(message).data(data).build();
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

    public Object getData() {
        return data;
    }

    public static class MessageResponseBuilder {
        private boolean success;
        private String message;
        private Object data;

        public MessageResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }

        public MessageResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public MessageResponseBuilder data(Object data) {
            this.data = data;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(this);
        }
    }
}
