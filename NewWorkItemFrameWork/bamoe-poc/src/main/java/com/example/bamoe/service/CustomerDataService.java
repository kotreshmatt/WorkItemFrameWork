package com.example.bamoe.service;

import com.example.bamoe.model.Customer;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CustomerDataService {

    @Inject
    @RestClient
    CustomerService customerService;

    public Customer fetchCustomer(String customerId) {
        // In a real scenario, this would call the external API
        // For POC, we'll simulate a response or pass through if the external API works
        try {
            // Using a mock response for reliability in POC environment without reliable
            // internet for specific APIs
            if ("123".equals(customerId)) {
                return new Customer("123", "John Doe", "john@example.com");
            } else if ("456".equals(customerId)) {
                return new Customer("456", "Jane Smith", "jane@example.com");
            }
            return new Customer(customerId, "Unknown User", "unknown@example.com");
        } catch (Exception e) {
            e.printStackTrace();
            return new Customer(customerId, "Fallback User", "fallback@example.com");
        }
    }
}
