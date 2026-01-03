package com.example.bamoe.model;

public class Order {
    private String id;
    private String customerId;
    private double amount;
    private String status;
    private boolean valid;

    public Order() {
    }

    public Order(String id, String customerId, double amount) {
        this.id = id;
        this.customerId = customerId;
        this.amount = amount;
        this.status = "PENDING";
        this.valid = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    @Override
    public String toString() {
        return "Order{id='" + id + "', customerId='" + customerId + "', amount=" + amount + ", status='" + status
                + "'}";
    }
}
