# Notification System Test Suite

This comprehensive test suite validates the notification system for the HIV clinic application, with particular focus on resolving the "Unknown Patient" issue and ensuring robust functionality across all notification workflows.

## Test Structure

### Backend Tests (Java/Spring Boot)
- **Location**: `src/test/java/com/hivclinic/`
- **Framework**: JUnit 5 + Mockito
- **Coverage**: Service layer, Controller layer, Repository integration

### Frontend Tests (React/JavaScript)
- **Location**: `src/test/`
- **Framework**: Vitest + React Testing Library
- **Coverage**: Components, Services, Integration workflows

## Test Categories

### 1. Backend Service Tests

#### DoctorNotificationServiceTest
- **File**: `src/test/java/com/hivclinic/service/DoctorNotificationServiceTest.java`
- **Purpose**: Tests the core doctor notification service functionality
- **Key Tests**:
  - Patient data retrieval with complete profile information
  - Notification sending with proper patient name resolution
  - Patient data fallback mechanisms (addresses "Unknown Patient" issue)
  - Permission validation for doctor-specific operations
  - Error handling for missing patient data

#### NotificationControllerTest
- **File**: `src/test/java/com/hivclinic/controller/NotificationControllerTest.java`
- **Purpose**: Tests REST API endpoints for notification management
- **Key Tests**:
  - Authentication and authorization
  - Request/response validation
  - Error response handling
  - Doctor-specific endpoint access

#### NotificationServiceTest
- **File**: `src/test/java/com/hivclinic/service/NotificationServiceTest.java`
- **Purpose**: Tests core notification management functionality
- **Key Tests**:
  - Notification creation and management
  - Status tracking and updates
  - Notification type handling
  - Reading and marking notifications
  - Bulk operations support

### 2. Frontend Service Tests

#### notificationService.test.js
- **File**: `src/test/services/notificationService.test.js`
- **Purpose**: Tests frontend API service layer
- **Key Tests**:
  - API endpoint communication
  - Patient data structure validation
  - Error handling and network failures
  - Authentication token management
  - Response data transformation

### 3. Frontend Component Tests

#### NotificationManagementDashboard.test.jsx
- **File**: `src/test/components/NotificationManagementDashboard.test.jsx`
- **Purpose**: Tests the main notification management interface
- **Key Tests**:
  - Component loading and initialization
  - Patient data display with proper names (fixes "Unknown Patient")
  - Modal interactions and workflows
  - Error handling and user feedback
  - Filter and search functionality
  - Analytics and dashboard metrics

#### PatientSelector.test.jsx
- **File**: `src/test/components/PatientSelector.test.jsx`
- **Purpose**: Tests patient selection component
- **Key Tests**:
  - Patient list rendering and display
  - Single and multi-select functionality
  - Search and filtering capabilities
  - Patient data validation
  - Accessibility and keyboard navigation
  - Performance with large datasets

### 4. Integration Tests

#### NotificationWorkflow.test.js
- **File**: `src/test/integration/NotificationWorkflow.test.js`
- **Purpose**: End-to-end workflow validation
- **Key Tests**:
  - Complete notification sending workflow
  - Patient data retrieval and display integrity
  - Authentication and authorization flow
  - Error handling across the entire system
  - Real-time updates and data refresh
  - Performance with large datasets

## Critical Test Scenarios

### "Unknown Patient" Issue Resolution
The test suite specifically addresses the "Unknown Patient" problem through:

1. **Patient Data Integrity Tests**: Validate that patient profile data is properly retrieved and mapped
2. **Fallback Mechanism Tests**: Ensure graceful handling when patient data is incomplete
3. **Name Resolution Tests**: Verify proper firstName/lastName combination and fallback to email
4. **Integration Workflow Tests**: End-to-end validation of patient name display

### Error Handling Coverage
- Network failures and API timeouts
- Invalid authentication tokens
- Missing or malformed patient data
- Database connection issues
- Permission and authorization failures

### Performance Testing
- Large patient datasets (100+ patients)
- High-volume notification history (200+ notifications)
- Concurrent user operations
- Real-time data updates

## Test Configuration

### Setup Files
- **testSetup.js**: Global test configuration and utilities
- **vitest.config.js**: Vitest configuration with coverage settings

### Test Utilities
- Mock factories for users, patients, notifications, templates
- Authentication context helpers
- API response simulation utilities
- Data validation helpers

## Running Tests

### Backend Tests (Java)
```bash
# Run all backend tests
mvn test

# Run specific test class
mvn test -Dtest=DoctorNotificationServiceTest

# Run with coverage
mvn test jacoco:report
```

### Frontend Tests (JavaScript)
```bash
# Run all frontend tests
npm test

# Run specific test file
npm test NotificationManagementDashboard.test.jsx

# Run with coverage
npm run test:coverage

# Run integration tests only
npm test integration/
```

### Test Coverage Goals
- **Backend**: 85% line coverage, 80% branch coverage
- **Frontend**: 80% line coverage, 75% branch coverage
- **Integration**: 90% critical path coverage

## Test Data Management

### Mock Data Structure
All tests use consistent mock data structures that mirror production:

```javascript
// Patient data structure
const mockPatient = {
  userId: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  phone: '123-456-7890',
  lastAppointment: '2024-01-15T10:00:00',
  appointmentStatus: 'COMPLETED',
  // Profile data to prevent "Unknown Patient"
  dateOfBirth: '1990-01-01',
  address: '123 Main St',
  emergencyContact: 'Emergency Contact',
  emergencyPhone: '987-654-3210'
}

// Notification data structure
const mockNotification = {
  notificationId: 1,
  patientId: 1,
  title: 'Test Notification',
  message: 'Test message',
  status: 'SENT',
  type: 'APPOINTMENT_REMINDER',
  createdAt: '2024-01-15T10:00:00',
  sentAt: '2024-01-15T10:01:00',
  templateId: 1
}
```

## Quality Assurance

### Test Standards
- All tests must be deterministic and repeatable
- Mock data must reflect realistic scenarios
- Error conditions must be thoroughly tested
- Performance implications must be considered

### Continuous Integration
- Tests run automatically on every commit
- Coverage reports are generated and tracked
- Failed tests block deployment
- Performance benchmarks are monitored

## Troubleshooting

### Common Issues
1. **"Unknown Patient" appearing in tests**: Ensure patient data includes firstName and lastName
2. **Authentication failures**: Verify mock user includes both userId and id properties
3. **API timeout errors**: Check mock delays and timeout configurations
4. **Component rendering issues**: Ensure all required contexts are provided

### Debug Utilities
- Use `screen.debug()` to inspect component state
- Enable verbose logging with `DEBUG=true npm test`
- Use `--reporter=verbose` for detailed test output
- Check browser console for runtime errors

## Contributing

### Adding New Tests
1. Follow existing naming conventions
2. Include both positive and negative test cases
3. Add comprehensive error handling tests
4. Update this README with new test descriptions
5. Ensure adequate test coverage

### Test Review Checklist
- [ ] Tests cover all code paths
- [ ] Error conditions are tested
- [ ] Mock data is realistic
- [ ] Tests are deterministic
- [ ] Performance impact is considered
- [ ] Documentation is updated

## Future Improvements

### Planned Enhancements
- Visual regression testing with screenshot comparison
- Load testing with simulated user traffic
- Automated accessibility testing
- Cross-browser compatibility testing
- Mobile responsiveness testing

### Monitoring and Metrics
- Test execution time tracking
- Coverage trend analysis
- Failure rate monitoring
- Performance benchmark tracking