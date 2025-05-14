require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../src/config/supabase');

async function createAdmin() {
    try {
        // Admin credentials
        const admin = {
            name: 'Pavan Kumar',
            email: 'pavankumarv1497@gmail.com',
            password: 'Sulochana5%+'
        };

        console.log('Checking if admin already exists...');
        
        // Check if admin already exists
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', admin.email)
            .single();

        if (existingAdmin) {
            console.log('Admin already exists with this email.');
            return;
        }

        console.log('Hashing password...');
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(admin.password, salt);

        console.log('Creating admin user...');
        
        // Insert admin into database
        const { data, error } = await supabase
            .from('admins')
            .insert([{
                name: admin.name,
                email: admin.email,
                password_hash: passwordHash
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating admin:', error.message);
            console.error('Full error:', error);
            return;
        }

        console.log('Admin created successfully:', {
            id: data.id,
            name: data.name,
            email: data.email
        });

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        process.exit();
    }
}

createAdmin(); 