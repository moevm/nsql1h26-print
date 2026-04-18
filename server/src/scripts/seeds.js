import { getSession } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import bcrypt from 'bcryptjs'; 

export const seedDatabase = async () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const session = getSession();
  try {

    const users = [
      { email: 'admin@print.local', password: 'admin123', first_name: 'Админ', last_name: 'Системный', role: 'admin', phone: '+79990001111' },
      { email: 'emp@print.local', password: 'emp123', first_name: 'Сотрудник', last_name: 'Первый', role: 'employee', phone: '+79990002222' },
      { email: 'client@print.local', password: 'client123', first_name: 'Клиент', last_name: 'Тестовый', role: 'client', phone: '+79990003333' }
    ];

    for (const u of users) {
      const user_id = uuidv4();
      const password_hash = await bcrypt.hash(u.password, 10);
      
      await session.run(
        `MERGE (u:User {email: $email})
         SET u += $props, 
             u.user_id = $user_id, 
             u.password_hash = $password_hash,
             u.created_at = COALESCE(u.created_at, datetime())`,
        { 
          email: u.email, 
          props: { 
            first_name: u.first_name, 
            last_name: u.last_name, 
            role: u.role, 
            phone: u.phone 
          }, 
          user_id, 
          password_hash 
        }
      );
      console.log(`User seeded: ${u.email}`);
    }

    
    // Услуги печати/сканирования
    const services = [
      { service_type: 'print', base_price: 5.0, color_mode: 'bw' },
      { service_type: 'print', base_price: 15.0, color_mode: 'color' },
      { service_type: 'scan', base_price: 3.0, color_mode: 'bw' },
      { service_type: 'scan', base_price: 10.0, color_mode: 'color' },
      { service_type: 'risography', base_price: 2.5, start_circulation: 1, end_circulation: 99 },
      { service_type: 'risography', base_price: 2.0, start_circulation: 100, end_circulation: 499 }
    ];
    
    for (const s of services) {
      const service_id = uuidv4();
      await session.run(
        `MERGE (s:Service {service_id: $service_id})
         SET s += $props, s.changed_at = datetime()`,
        { service_id, props: s }
      );
    }
    console.log('Test data seeded with bcrypt hashes');
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    await session.close();
  }
};