// InvObi seed script
// Place this file in your `backend` folder (next to client.js) and run:
//   node seed.js
//
// It is safe to run more than once: unique records are upserted, so you
// won't get duplicates. Assumes the Department -> Gestiune rename is done
// (i.e. prisma.gestiune exists). If you haven't renamed yet, swap
// prisma.gestiune for prisma.department and gestiuneId for departmentId.

const prisma = require('./client');
const bcrypt = require('bcrypt');

async function ensureResponsible(name, email) {
    const existing = await prisma.responsiblePerson.findFirst({ where: { name } });
    if (existing) return existing;
    return prisma.responsiblePerson.create({ data: { name, email } });
}

async function main() {
    console.log('Seeding InvObi...');

    // ---- Users ----
    const adminPassword = await bcrypt.hash('admin123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@invobi.local',
            password: adminPassword,
            role: 'ADMIN'
        }
    });

    await prisma.user.upsert({
        where: { username: 'viewer' },
        update: {},
        create: {
            username: 'viewer',
            email: 'viewer@invobi.local',
            password: viewerPassword,
            role: 'VIEWER'
        }
    });

    // ---- Gestiuni (unique name -> upsert) ----
    const gestiuneNames = ['Gestiune IT', 'Gestiune Birou', 'Gestiune Depozit'];
    const gestiuni = {};
    for (const name of gestiuneNames) {
        gestiuni[name] = await prisma.gestiune.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    // ---- Locations (unique name -> upsert) ----
    const locationNames = ['Sediu Central', 'Etaj 1', 'Etaj 2', 'Depozit A'];
    const locations = {};
    for (const name of locationNames) {
        locations[name] = await prisma.location.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    // ---- Categories (unique name -> upsert) ----
    const categoryNames = ['Electronice', 'Mobilier', 'Echipamente', 'Consumabile'];
    const categories = {};
    for (const name of categoryNames) {
        categories[name] = await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    // ---- Responsible persons (name not unique -> find-or-create) ----
    const ana = await ensureResponsible('Ana Popescu', 'ana.popescu@invobi.local');
    const mihai = await ensureResponsible('Mihai Ionescu', 'mihai.ionescu@invobi.local');
    const elena = await ensureResponsible('Elena Radu', 'elena.radu@invobi.local');

    // ---- Items (unique inventoryNumber -> upsert) ----
    const items = [
        {
            inventoryNumber: 'IT-001', name: 'Laptop Dell Latitude',
            description: 'Laptop business 14"', cost: 4200.00, status: 'ACTIVE',
            gestiune: 'Gestiune IT', location: 'Etaj 1', category: 'Electronice', responsible: ana.id
        },
        {
            inventoryNumber: 'IT-002', name: 'Monitor LG 27"',
            description: 'Monitor IPS Full HD', cost: 950.50, status: 'ACTIVE',
            gestiune: 'Gestiune IT', location: 'Etaj 1', category: 'Electronice', responsible: ana.id
        },
        {
            inventoryNumber: 'IT-003', name: 'Imprimanta HP LaserJet',
            description: 'Imprimanta laser alb-negru', cost: 1300.00, status: 'MOVED',
            gestiune: 'Gestiune IT', location: 'Etaj 2', category: 'Echipamente', responsible: mihai.id
        },
        {
            inventoryNumber: 'MOB-001', name: 'Birou lemn',
            description: 'Birou 160x80 cm', cost: 780.00, status: 'ACTIVE',
            gestiune: 'Gestiune Birou', location: 'Etaj 1', category: 'Mobilier', responsible: mihai.id
        },
        {
            inventoryNumber: 'MOB-002', name: 'Scaun ergonomic',
            description: 'Scaun reglabil', cost: 540.00, status: 'ACTIVE',
            gestiune: 'Gestiune Birou', location: 'Etaj 2', category: 'Mobilier', responsible: elena.id
        },
        {
            inventoryNumber: 'MOB-003', name: 'Dulap metalic',
            description: 'Dulap arhivare documente', cost: 620.00, status: 'UNAVAILABLE',
            gestiune: 'Gestiune Birou', location: 'Depozit A', category: 'Mobilier', responsible: elena.id
        },
        {
            inventoryNumber: 'DEP-001', name: 'Videoproiector Epson',
            description: 'Proiector sala conferinte', cost: 2100.00, status: 'ACTIVE',
            gestiune: 'Gestiune Depozit', location: 'Sediu Central', category: 'Electronice', responsible: ana.id
        },
        {
            inventoryNumber: 'DEP-002', name: 'Router vechi',
            description: 'Echipament retea iesit din uz', cost: 150.00, status: 'DECOMMISSIONED',
            gestiune: 'Gestiune Depozit', location: 'Depozit A', category: 'Echipamente', responsible: mihai.id
        }
    ];

    for (const it of items) {
        await prisma.item.upsert({
            where: { inventoryNumber: it.inventoryNumber },
            update: {},
            create: {
                inventoryNumber: it.inventoryNumber,
                name: it.name,
                description: it.description,
                cost: it.cost,
                status: it.status,
                gestiuneId: gestiuni[it.gestiune].id,
                locationId: locations[it.location].id,
                categoryId: categories[it.category].id,
                responsibleId: it.responsible,
                createdById: admin.id
            }
        });
    }

    console.log('Seed complete.');
    console.log('  Admin login  -> username: admin   password: admin123');
    console.log('  Viewer login -> username: viewer  password: viewer123');
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        process.exit(0);
    });