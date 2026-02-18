const neo4j = require('neo4j-driver');

// Подключение к базе
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
);

async function main() {
  const session = driver.session();

  try {
    await session.run('MATCH (n:Test) DETACH DELETE n');
    
    // Создаем тестовый узел
    await session.run(
      'CREATE (n:Test {name: $name}) RETURN n',
      { name: 'HelloWorld' }
    );

    console.log('Данные записаны!');

    // Читаем данные
    const result = await session.run(
      'MATCH (n:Test {name: $name}) RETURN n.name AS name',
      { name: 'HelloWorld' }
    );

    result.records.forEach(record => {
      console.log('Прочитано из БД:', record.get('name'));
    });

  } catch (error) {
    console.error(error);
  } finally {
    await session.close();
    await driver.close();
  }
}

main();
