import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatientSelector from '../../components/notifications/PatientSelector'

// Mock the loading spinner component
vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: ({ size = 'medium' }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  )
}))

describe('PatientSelector', () => {
  const mockPatients = [
    {
      userId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      phone: '123-456-7890',
      lastAppointment: '2024-01-15T10:00:00',
      appointmentStatus: 'COMPLETED',
      profileImage: null
    },
    {
      userId: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      phone: '098-765-4321',
      lastAppointment: '2024-01-16T14:00:00',
      appointmentStatus: 'SCHEDULED',
      profileImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
    },
    {
      userId: 3,
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@test.com',
      phone: '555-123-4567',
      lastAppointment: '2024-01-10T09:00:00',
      appointmentStatus: 'CANCELLED',
      profileImage: null
    }
  ]

  const defaultProps = {
    patients: mockPatients,
    selectedPatients: [],
    onSelectionChange: vi.fn(),
    loading: false,
    error: null,
    multiSelect: true,
    showSearch: true,
    showFilters: true,
    maxSelections: null,
    disabled: false,
    className: ''
  }

  const renderPatientSelector = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props }
    return render(<PatientSelector {...mergedProps} />)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render patient selector with default props', () => {
      renderPatientSelector()

      expect(screen.getByText('Select Patients')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /search patients/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument()
    })

    it('should render loading state', () => {
      renderPatientSelector({ loading: true })

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading patients...')).toBeInTheDocument()
    })

    it('should render error state', () => {
      const errorMessage = 'Failed to load patients'
      renderPatientSelector({ error: errorMessage })

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should render empty state when no patients', () => {
      renderPatientSelector({ patients: [] })

      expect(screen.getByText('No patients available')).toBeInTheDocument()
      expect(screen.getByText(/no patients match the current criteria/i)).toBeInTheDocument()
    })

    it('should render patient cards for each patient', () => {
      renderPatientSelector()

      mockPatients.forEach(patient => {
        expect(screen.getByText(`${patient.firstName} ${patient.lastName}`)).toBeInTheDocument()
        expect(screen.getByText(patient.email)).toBeInTheDocument()
      })
    })

    it('should apply custom className', () => {
      const customClass = 'custom-selector'
      renderPatientSelector({ className: customClass })

      const container = screen.getByTestId('patient-selector')
      expect(container).toHaveClass(customClass)
    })
  })

  describe('Patient Selection', () => {
    it('should handle single patient selection', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        multiSelect: false, 
        onSelectionChange 
      })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      await user.click(firstPatientCard)

      expect(onSelectionChange).toHaveBeenCalledWith([1])
    })

    it('should handle multiple patient selection', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ onSelectionChange })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      const secondPatientCard = screen.getByTestId('patient-card-2')

      await user.click(firstPatientCard)
      expect(onSelectionChange).toHaveBeenCalledWith([1])

      await user.click(secondPatientCard)
      expect(onSelectionChange).toHaveBeenCalledWith([1, 2])
    })

    it('should deselect patient when clicked again in multi-select mode', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        selectedPatients: [1], 
        onSelectionChange 
      })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      await user.click(firstPatientCard)

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })

    it('should replace selection in single-select mode', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        multiSelect: false,
        selectedPatients: [1], 
        onSelectionChange 
      })

      const secondPatientCard = screen.getByTestId('patient-card-2')
      await user.click(secondPatientCard)

      expect(onSelectionChange).toHaveBeenCalledWith([2])
    })

    it('should respect maxSelections limit', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        maxSelections: 2,
        selectedPatients: [1, 2], 
        onSelectionChange 
      })

      const thirdPatientCard = screen.getByTestId('patient-card-3')
      await user.click(thirdPatientCard)

      // Should not add third patient
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('should show max selections warning', () => {
      renderPatientSelector({ 
        maxSelections: 2,
        selectedPatients: [1, 2]
      })

      expect(screen.getByText(/maximum 2 patients can be selected/i)).toBeInTheDocument()
    })

    it('should disable selection when component is disabled', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        disabled: true,
        onSelectionChange 
      })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      await user.click(firstPatientCard)

      expect(onSelectionChange).not.toHaveBeenCalled()
    })
  })

  describe('Search Functionality', () => {
    it('should filter patients by name', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      await user.type(searchInput, 'John')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should filter patients by email', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      await user.type(searchInput, 'jane.smith@test.com')

      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      await user.type(searchInput, 'JOHN')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show no results message when search yields no matches', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No patients found')).toBeInTheDocument()
      expect(screen.getByText(/no patients match your search criteria/i)).toBeInTheDocument()
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      await user.type(searchInput, 'John')

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(searchInput.value).toBe('')
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should not render search when showSearch is false', () => {
      renderPatientSelector({ showSearch: false })

      expect(screen.queryByRole('textbox', { name: /search patients/i })).not.toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('should filter patients by appointment status', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
      await user.selectOptions(statusFilter, 'COMPLETED')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })

    it('should show all patients when filter is set to all', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
      await user.selectOptions(statusFilter, 'ALL')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should not render filters when showFilters is false', () => {
      renderPatientSelector({ showFilters: false })

      expect(screen.queryByRole('combobox', { name: /filter by status/i })).not.toBeInTheDocument()
    })

    it('should combine search and filter', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const searchInput = screen.getByRole('textbox', { name: /search patients/i })
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })

      await user.type(searchInput, 'J')
      await user.selectOptions(statusFilter, 'COMPLETED')

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
    })
  })

  describe('Patient Card Display', () => {
    it('should display patient information correctly', () => {
      renderPatientSelector()

      const johnCard = screen.getByTestId('patient-card-1')
      expect(johnCard).toBeInTheDocument()
      
      within(johnCard).getByText('John Doe')
      within(johnCard).getByText('john.doe@test.com')
      within(johnCard).getByText('123-456-7890')
      within(johnCard).getByText(/last appointment: jan 15, 2024/i)
      within(johnCard).getByText('COMPLETED')
    })

    it('should display profile image when available', () => {
      renderPatientSelector()

      const janeCard = screen.getByTestId('patient-card-2')
      const profileImage = within(janeCard).getByRole('img', { name: /jane smith profile/i })
      
      expect(profileImage).toBeInTheDocument()
      expect(profileImage).toHaveAttribute('src', expect.stringContaining('data:image/jpeg;base64'))
    })

    it('should display default avatar when no profile image', () => {
      renderPatientSelector()

      const johnCard = screen.getByTestId('patient-card-1')
      const defaultAvatar = within(johnCard).getByTestId('default-avatar')
      
      expect(defaultAvatar).toBeInTheDocument()
    })

    it('should show selected state for selected patients', () => {
      renderPatientSelector({ selectedPatients: [1, 2] })

      const johnCard = screen.getByTestId('patient-card-1')
      const janeCard = screen.getByTestId('patient-card-2')
      const bobCard = screen.getByTestId('patient-card-3')

      expect(johnCard).toHaveClass('selected')
      expect(janeCard).toHaveClass('selected')
      expect(bobCard).not.toHaveClass('selected')
    })

    it('should show disabled state when component is disabled', () => {
      renderPatientSelector({ disabled: true })

      mockPatients.forEach(patient => {
        const patientCard = screen.getByTestId(`patient-card-${patient.userId}`)
        expect(patientCard).toHaveClass('disabled')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderPatientSelector()

      expect(screen.getByRole('textbox', { name: /search patients/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument()
      expect(screen.getByRole('region', { name: /patient list/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ onSelectionChange })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      firstPatientCard.focus()
      
      await user.keyboard('{Enter}')
      expect(onSelectionChange).toHaveBeenCalledWith([1])
    })

    it('should support space key for selection', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ onSelectionChange })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      firstPatientCard.focus()
      
      await user.keyboard('{ }')
      expect(onSelectionChange).toHaveBeenCalledWith([1])
    })

    it('should announce selection changes to screen readers', async () => {
      const user = userEvent.setup()
      renderPatientSelector()

      const firstPatientCard = screen.getByTestId('patient-card-1')
      await user.click(firstPatientCard)

      expect(screen.getByText(/1 patient selected/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large patient lists efficiently', () => {
      const largePatientList = Array.from({ length: 100 }, (_, index) => ({
        userId: index + 1,
        firstName: `Patient${index + 1}`,
        lastName: 'Test',
        email: `patient${index + 1}@test.com`,
        phone: `123-456-${String(index + 1).padStart(4, '0')}`,
        lastAppointment: '2024-01-15T10:00:00',
        appointmentStatus: 'COMPLETED'
      }))

      renderPatientSelector({ patients: largePatientList })

      expect(screen.getByText('Patient1 Test')).toBeInTheDocument()
      expect(screen.getByText('Patient100 Test')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed patient data gracefully', () => {
      const malformedPatients = [
        { userId: 1, firstName: 'John' }, // Missing required fields
        { userId: 2, lastName: 'Smith', email: 'invalid' }, // Missing firstName
        null, // Null patient
        undefined // Undefined patient
      ]

      renderPatientSelector({ patients: malformedPatients })

      // Should render valid patients and skip invalid ones
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Smith')).toBeInTheDocument()
    })

    it('should handle selection change errors gracefully', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn().mockImplementation(() => {
        throw new Error('Selection error')
      })
      
      renderPatientSelector({ onSelectionChange })

      const firstPatientCard = screen.getByTestId('patient-card-1')
      await user.click(firstPatientCard)

      // Should not crash the component
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Selection Summary', () => {
    it('should display selection count', () => {
      renderPatientSelector({ selectedPatients: [1, 2] })

      expect(screen.getByText(/2 patients selected/i)).toBeInTheDocument()
    })

    it('should display "Select All" option for multi-select', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ onSelectionChange })

      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)

      expect(onSelectionChange).toHaveBeenCalledWith([1, 2, 3])
    })

    it('should display "Clear All" option when patients are selected', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      
      renderPatientSelector({ 
        selectedPatients: [1, 2],
        onSelectionChange 
      })

      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearAllButton)

      expect(onSelectionChange).toHaveBeenCalledWith([])
    })
  })
})