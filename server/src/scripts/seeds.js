import { getSession } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const usersSeed = [
    { email: 'admin@print.local', password: 'admin123', first_name: 'Admin', last_name: 'One', role: 'admin', phone: '+79990001111' },
    { email: 'admin2@print.local', password: 'admin123', first_name: 'Admin', last_name: 'Two', role: 'admin', phone: '+79990001112' },
    { email: 'emp1@print.local', password: 'emp123', first_name: 'Employee', last_name: 'One', role: 'employee', phone: '+79990002221' },
    { email: 'emp2@print.local', password: 'emp123', first_name: 'Employee', last_name: 'Two', role: 'employee', phone: '+79990002222' },
    { email: 'client1@print.local', password: 'client123', first_name: 'Client', last_name: 'One', role: 'client', phone: '+79990003331' },
    { email: 'client2@print.local', password: 'client123', first_name: 'Client', last_name: 'Two', role: 'client', phone: '+79990003332' },
    { email: 'client3@print.local', password: 'client123', first_name: 'Client', last_name: 'Three', role: 'client', phone: '+79990003333' },
    { email: 'client4@print.local', password: 'client123', first_name: 'Client', last_name: 'Four', role: 'client', phone: '+79990003334' }
];

const servicesSeed = [
    { service_seed_key: 'print_bw', service_type: 'print', color_mode: 'bw', base_price: 5.0 },
    { service_seed_key: 'print_color', service_type: 'print', color_mode: 'color', base_price: 15.0 },
    { service_seed_key: 'scan_bw', service_type: 'scan', color_mode: 'bw', base_price: 3.0 },
    { service_seed_key: 'scan_color', service_type: 'scan', color_mode: 'color', base_price: 10.0 },
    { service_seed_key: 'riso_1_99', service_type: 'risography', start_circulation: 1, end_circulation: 99, base_price: 2.5 },
    { service_seed_key: 'riso_100_499', service_type: 'risography', start_circulation: 100, end_circulation: 499, base_price: 2.0 }
];

const ordersSeed = [
    { order_seed_key: 'o1', client_email: 'client1@print.local', service_seed_key: 'print_bw', quantity: 12, file_pages: 12, file_name: 'order-1.pdf', file_size: 1048576, notes: 'Urgent by evening', status: 'pending', parameters: { format: 'A4', color_mode: 'bw' } },
    { order_seed_key: 'o2', client_email: 'client1@print.local', service_seed_key: 'print_color', quantity: 3, file_pages: 6, file_name: 'photo-book.pdf', file_size: 524288, notes: 'Color print', status: 'processing', parameters: { format: 'A5', color_mode: 'color' } },
    { order_seed_key: 'o3', client_email: 'client2@print.local', service_seed_key: 'scan_bw', quantity: 2, file_pages: 0, file_name: '', file_size: 0, notes: 'Passport scan', status: 'ready', parameters: { format: 'A4', color_mode: 'bw', quality: 'high', time_slot: '11:00-13:00' } },
    { order_seed_key: 'o4', client_email: 'client2@print.local', service_seed_key: 'scan_color', quantity: 1, file_pages: 0, file_name: '', file_size: 0, notes: 'Diploma scan', status: 'completed', parameters: { format: 'A4', color_mode: 'color', quality: 'compressed', time_slot: '13:00-15:00' } },
    { order_seed_key: 'o5', client_email: 'client3@print.local', service_seed_key: 'riso_1_99', quantity: 80, file_pages: 2, file_name: 'leaflet.pdf', file_size: 890123, notes: 'Leaflets', status: 'pending', parameters: { format: 'A4', circulation: 80 } },
    { order_seed_key: 'o6', client_email: 'client3@print.local', service_seed_key: 'riso_100_499', quantity: 180, file_pages: 4, file_name: 'brochure.pdf', file_size: 1400123, notes: 'Brochures', status: 'processing', parameters: { format: 'A4', circulation: 180 } },
    { order_seed_key: 'o7', client_email: 'client4@print.local', service_seed_key: 'print_bw', quantity: 20, file_pages: 1, file_name: 'ticket.pdf', file_size: 220123, notes: 'Tickets', status: 'cancelled', parameters: { format: 'A5', color_mode: 'bw' } },
    { order_seed_key: 'o8', client_email: 'client4@print.local', service_seed_key: 'scan_bw', quantity: 5, file_pages: 0, file_name: '', file_size: 0, notes: 'Archive scans', status: 'pending', parameters: { format: 'A4', color_mode: 'bw', quality: 'high', time_slot: '15:00-17:00' } }
];

const statusHistorySeed = [
    // Заказ o1
    { history_seed_key: 'h1', order_seed_key: 'o1', new_status: 'pending', notes: 'initial status', employee_email: 'client1@print.local' },

    // Заказ o2
    { history_seed_key: 'h2', order_seed_key: 'o2', new_status: 'pending', notes: 'initial status', employee_email: 'client1@print.local' },
    { history_seed_key: 'h3', order_seed_key: 'o2', new_status: 'processing', notes: 'in progress', employee_email: 'emp2@print.local' },

    // Заказ o3
    { history_seed_key: 'h4', order_seed_key: 'o3', new_status: 'pending', notes: 'initial status', employee_email: 'client2@print.local' },
    { history_seed_key: 'h5', order_seed_key: 'o3', new_status: 'ready', notes: 'completed', employee_email: 'emp1@print.local' },

    // Заказ o4
    { history_seed_key: 'h6', order_seed_key: 'o4', new_status: 'pending', notes: 'initial status', employee_email: 'client2@print.local' },
    { history_seed_key: 'h7', order_seed_key: 'o4', new_status: 'completed', notes: 'handed to client', employee_email: 'emp1@print.local' },

    // Заказ o5
    { history_seed_key: 'h_o5_init', order_seed_key: 'o5', new_status: 'pending', notes: 'initial status', employee_email: 'client3@print.local' },

    // Заказ o6
    { history_seed_key: 'h_o6_init', order_seed_key: 'o6', new_status: 'pending', notes: 'initial status', employee_email: 'client3@print.local' },
    { history_seed_key: 'h8', order_seed_key: 'o6', new_status: 'processing', notes: 'accepted to production', employee_email: 'emp2@print.local' },

    // Заказ o7
    { history_seed_key: 'h_o7_init', order_seed_key: 'o7', new_status: 'pending', notes: 'initial status', employee_email: 'client4@print.local' },
    { history_seed_key: 'h9', order_seed_key: 'o7', new_status: 'cancelled', notes: 'corrupted file', employee_email: 'emp1@print.local' },

    // Заказ o8
    { history_seed_key: 'h10', order_seed_key: 'o8', new_status: 'pending', notes: 'initial status', employee_email: 'client4@print.local' }
];

const importExportLogsSeed = [
    { log_seed_key: 'l1', operation_type: 'import', status: 'success', admin_email: 'admin@print.local' },
    { log_seed_key: 'l2', operation_type: 'export', status: 'success', admin_email: 'admin@print.local' },
    { log_seed_key: 'l3', operation_type: 'import', status: 'failed', admin_email: 'admin2@print.local' },
    { log_seed_key: 'l4', operation_type: 'export', status: 'success', admin_email: 'admin2@print.local' },
    { log_seed_key: 'l5', operation_type: 'import', status: 'success', admin_email: 'admin@print.local' },
    { log_seed_key: 'l6', operation_type: 'export', status: 'failed', admin_email: 'admin2@print.local' },
    { log_seed_key: 'l7', operation_type: 'import', status: 'success', admin_email: 'admin@print.local' },
    { log_seed_key: 'l8', operation_type: 'export', status: 'success', admin_email: 'admin2@print.local' },
    { log_seed_key: 'l9', operation_type: 'import', status: 'failed', admin_email: 'admin@print.local' },
    { log_seed_key: 'l10', operation_type: 'export', status: 'success', admin_email: 'admin@print.local' }
];

export const seedDatabase = async () => {
    if (process.env.NODE_ENV !== 'development') return;

    const session = getSession();

    try {
        const userIdsByEmail = new Map();
        const serviceIdsByKey = new Map();
        const orderIdsByKey = new Map();

        for (const user of usersSeed) {
            const passwordHash = await bcrypt.hash(user.password, 10);
            const userResult = await session.run(
                `MERGE (u:User {email: $email})
                 ON CREATE SET u.user_id = randomUUID(), u.created_at = datetime(), u.deactivated_at = null
                 SET u.first_name = $first_name,
                     u.last_name = $last_name,
                     u.role = $role,
                     u.phone = $phone,
                     u.password_hash = $password_hash
                 RETURN u.user_id AS user_id`,
                {
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    phone: user.phone,
                    password_hash: passwordHash
                }
            );
            userIdsByEmail.set(user.email, userResult.records[0].get('user_id'));
        }

        for (const service of servicesSeed) {
            const serviceResult = await session.run(
                `MERGE (s:Service {service_seed_key: $service_seed_key})
                 ON CREATE SET s.service_id = randomUUID(), s.deactivated_at = null
                 SET s.service_type = $service_type,
                     s.base_price = $base_price,
                     s.color_mode = $color_mode,
                     s.start_circulation = $start_circulation,
                     s.end_circulation = $end_circulation,
                     s.changed_at = datetime()
                 RETURN s.service_id AS service_id`,
                {
                    service_seed_key: service.service_seed_key,
                    service_type: service.service_type,
                    base_price: service.base_price,
                    color_mode: service.color_mode ?? null,
                    start_circulation: service.start_circulation ?? null,
                    end_circulation: service.end_circulation ?? null
                }
            );
            serviceIdsByKey.set(service.service_seed_key, serviceResult.records[0].get('service_id'));
        }

        for (const order of ordersSeed) {
            const orderId = uuidv4();
            const userId = userIdsByEmail.get(order.client_email);
            const serviceId = serviceIdsByKey.get(order.service_seed_key);

            const orderResult = await session.run(
                `MATCH (u:User {user_id: $user_id})
                 MATCH (s:Service {service_id: $service_id})
                 MERGE (o:Order {order_seed_key: $order_seed_key})
                 ON CREATE SET o.order_id = $order_id, o.created_at = datetime()
                 SET o.quantity = $quantity,
                     o.parameters = $parameters,
                     o.notes = $notes,
                     o.status = $status,
                     o.file_name = $file_name,
                     o.file_size = $file_size,
                     o.file_pages = $file_pages,
                     o.base_price = toFloat(s.base_price)
                 MERGE (u)-[:PLACED_ORDER]->(o)
                 MERGE (o)-[:FOR_SERVICE]->(s)
                 MERGE (o)-[c:CONTAINS]->(s)
                 SET c.unit_price = toFloat(s.base_price)
                 RETURN o.order_id AS order_id`,
                {
                    order_seed_key: order.order_seed_key,
                    order_id: orderId,
                    user_id: userId,
                    service_id: serviceId,
                    quantity: order.quantity,
                    parameters: JSON.stringify(order.parameters),
                    notes: order.notes,
                    status: order.status,
                    file_name: order.file_name,
                    file_size: order.file_size,
                    file_pages: order.file_pages
                }
            );

            orderIdsByKey.set(order.order_seed_key, orderResult.records[0].get('order_id'));
        }

        for (const history of statusHistorySeed) {
            const orderId = orderIdsByKey.get(history.order_seed_key);
            const employeeId = userIdsByEmail.get(history.employee_email);

            await session.run(
                `MATCH (o:Order {order_id: $order_id})
                 MATCH (e:User {user_id: $employee_id})
                 MERGE (h:StatusHistory {history_seed_key: $history_seed_key})
                 ON CREATE SET h.history_id = randomUUID(), h.changed_at = datetime()
                 SET h.new_status = $new_status,
                     h.notes = $notes
                 MERGE (o)-[:HAS_STATUS_HISTORY]->(h)
                 MERGE (h)-[:CHANGED_BY]->(e)
                 MERGE (h)-[:INITIATED_STATUS_CHANGE]->(e)`,
                {
                    history_seed_key: history.history_seed_key,
                    order_id: orderId,
                    employee_id: employeeId,
                    new_status: history.new_status,
                    notes: history.notes
                }
            );
        }

        for (const log of importExportLogsSeed) {
            const adminId = userIdsByEmail.get(log.admin_email);

            await session.run(
                `MATCH (a:User {user_id: $admin_id})
                 MERGE (l:ImportExportLogs {log_seed_key: $log_seed_key})
                 ON CREATE SET l.log_id = randomUUID(), l.created_at = datetime()
                 SET l.operation_type = $operation_type,
                     l.status = $status
                 MERGE (a)-[:INITIATED_OPERATION]->(l)`,
                {
                    log_seed_key: log.log_seed_key,
                    admin_id: adminId,
                    operation_type: log.operation_type,
                    status: log.status
                }
            );
        }

        console.log('Сидирование завершено: 8 пользователей, 6 услуг, 8 заказов, 13 историй статусов, 10 логов импорта/экспорта');
    } catch (e) {
        console.error('Ошибка сидирования:', e.message);
    } finally {
        await session.close();
    }
};