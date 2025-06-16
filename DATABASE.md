# Database Structure and Management

This document explains the database structure of Horizonte Clínica and provides guidance on database management, cleanup, and preparation for production use.

## Database Technology

The application uses **Deno KV** (Key-Value store) as its database system. Deno KV is a built-in, serverless database that provides ACID transactions and automatic scaling.

### Key Features:
- **Serverless**: No separate database server required
- **ACID Transactions**: Ensures data consistency
- **Automatic Scaling**: Handles high loads automatically
- **Local Development**: Uses local SQLite in development
- **Production Ready**: Uses Deno Deploy's distributed KV in production

## Database Structure

### Data Models

#### Users (`users`)
- **Primary Key**: Email address
- **Secondary Keys**: User ID, Role-based indexing
- **Roles**: `superadmin`, `admin`, `psychologist`
- **Fields**: Email, password hash, name, DNI, specialty, license number, etc.

#### Patients (`patients`)
- **Primary Key**: UUID
- **Secondary Keys**: Name-based indexing for search
- **Fields**: Name, DNI, email, phone, medical history, emergency contact, etc.

#### Appointments (`appointments`)
- **Primary Key**: UUID
- **Secondary Keys**: Psychologist email, patient name, date
- **Fields**: Date, time, room assignment, status, notes, status history

#### Rooms (`rooms`)
- **Primary Key**: UUID
- **Fields**: Name, availability, equipment, capacity, room type, description

#### Sessions (`sessions`)
- **Primary Key**: Session ID
- **Fields**: User email, creation timestamp
- **Auto-cleanup**: Expired sessions are automatically removed

### Key-Value Structure

```
users/[email] -> User object
users_by_id/[uuid] -> Email address
users_by_role/[role]/[email] -> Email address

patients/[uuid] -> Patient object
patients_by_name/[name]/[uuid] -> Patient ID

appointments/[uuid] -> Appointment object
appointments_by_psychologist/[email]/[uuid] -> Appointment ID

rooms/[uuid] -> Room object

sessions/[session_id] -> Session data
```

## Database Management Tools

### 1. Database Inspection

View current database content and statistics:

```bash
deno task inspect-db
```

This command provides:
- Record counts for all data types
- User listings with roles and status
- Room configurations and availability
- Patient information
- Appointment statistics and analysis
- Active sessions
- Health indicators and recommendations

### 2. Test Data Cleanup

Clean test data and prepare for production:

```bash
deno task cleanup-data
```

This command:
- ✅ Removes all test appointments
- ✅ Removes test patients
- ✅ Removes test psychologist users
- ✅ Keeps administrative users
- ✅ Keeps room configurations
- ✅ Clears active sessions
- ✅ Provides detailed cleanup report

**Warning**: This operation is irreversible. Always backup your data first if needed.

### 3. Database Seeding

Populate database with test data for development:

```bash
deno task seed
```

This creates:
- Administrative users (superadmin, admin)
- Test psychologists with various specialties
- Test patients with medical information
- Test appointments with realistic schedules
- Room configurations for different therapy types

### 4. Data Repair

Fix corrupted KV data and rebuild indexes:

```bash
deno task fix-kv
```

## Production Preparation Workflow

### Step 1: Inspect Current State
```bash
deno task inspect-db
```

Review the current database content and identify test data.

### Step 2: Clean Test Data
```bash
deno task cleanup-data
```

This will prompt for confirmation before cleaning. The script will:
- Keep essential administrative users
- Remove all test appointments and patients
- Clear sessions for fresh start

### Step 3: Verify Clean State
```bash
deno task inspect-db
```

Confirm that only production-ready data remains.

### Step 4: Create Production Users

Use the application's admin interface to:
- Create real psychologist accounts
- Configure user permissions
- Set up professional profiles

### Step 5: Configure Rooms

Review and adjust room configurations:
- Update room names and descriptions
- Set appropriate availability
- Configure equipment lists
- Adjust capacity limits

## Data Types and Validation

### User Validation
- Email format validation
- Password strength requirements
- DNI format validation (7-30 characters)
- License number format for psychologists

### Patient Validation
- Required: name
- Optional: DNI, email, phone, medical history
- Emergency contact validation
- Date format validation (YYYY-MM-DD)

### Appointment Validation
- Date/time conflict checking
- Room availability validation
- Psychologist schedule validation
- Status transition validation

### Room Validation
- Unique room names
- Equipment list validation
- Capacity limits
- Room type constraints

## Backup and Recovery

### Manual Backup
Currently, Deno KV doesn't provide built-in backup tools. For local development:

1. The KV data is stored in a local SQLite file
2. You can copy this file for backup purposes
3. Location varies by system

### Production Backup
On Deno Deploy, KV data is automatically:
- Replicated across multiple regions
- Backed up regularly
- Protected against hardware failures

## Performance Considerations

### Indexing Strategy
- Primary keys for direct lookups
- Secondary indexes for common queries
- Role-based indexes for permission checks
- Date-based indexes for appointment queries

### Query Optimization
- Use specific key prefixes for efficient queries
- Limit result sets with pagination
- Cache frequently accessed data
- Use batch operations for bulk updates

## Security

### Data Protection
- Passwords are hashed using bcrypt
- Session tokens are cryptographically secure
- User input is validated and sanitized
- ACID transactions prevent data corruption

### Access Control
- Role-based permissions (superadmin, admin, psychologist)
- Session-based authentication
- Email-based user identification
- Secure password reset flows

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure proper Deno flags: `--unstable-kv --allow-read --allow-write --allow-env`

2. **Corrupted Indexes**
   - Run: `deno task fix-kv`

3. **Session Issues**
   - Clear sessions: `deno task cleanup-data`
   - Or manually delete sessions from KV

4. **Data Inconsistencies**
   - Use inspection script to identify issues
   - Run data repair script
   - Rebuild from seed if necessary

### Getting Help

For database-related issues:
1. Run `deno task inspect-db` to understand current state
2. Check application logs for error details
3. Use repair scripts if data corruption is detected
4. Contact system administrator for complex issues

## Migration and Updates

### Schema Changes
When updating data models:
1. Create migration scripts in `/scripts/`
2. Test on development data first
3. Backup production data
4. Run migration scripts
5. Verify data integrity

### Version Compatibility
- KV structure is backward compatible
- New fields are optional by default
- Deprecated fields are marked but maintained
- Migration scripts handle version differences

---

**Last Updated**: June 16, 2025
**Database Version**: 1.0
**Deno Version**: 1.x with KV support