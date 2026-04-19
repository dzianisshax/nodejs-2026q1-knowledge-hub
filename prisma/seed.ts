import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: { login: 'admin', password: 'admin123', role: 'admin' } as any,
  });

  const editor = await prisma.user.upsert({
    where: { login: 'editor' },
    update: {},
    create: { login: 'editor', password: 'editor123', role: 'editor' } as any,
  });

  const [catTech, catScience, catLifestyle] = await Promise.all([
    prisma.category.create({
      data: { name: 'Technology', description: 'Tech articles' },
    }),
    prisma.category.create({
      data: { name: 'Science', description: 'Science articles' },
    }),
    prisma.category.create({
      data: { name: 'Lifestyle', description: 'Lifestyle articles' },
    }),
  ]);

  const tagNames = ['nodejs', 'typescript', 'prisma', 'docker', 'postgresql'];
  await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with NestJS',
      content: 'NestJS is a progressive Node.js framework...',
      status: 'published',
      authorId: admin.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'nodejs' }, create: { name: 'nodejs' } },
          { where: { name: 'typescript' }, create: { name: 'typescript' } },
        ],
      },
    } as any,
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Prisma ORM Deep Dive',
      content: 'Prisma is a next-generation ORM...',
      status: 'published',
      authorId: editor.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'prisma' }, create: { name: 'prisma' } },
          { where: { name: 'postgresql' }, create: { name: 'postgresql' } },
        ],
      },
    } as any,
  });

  await prisma.article.create({
    data: {
      title: 'Docker for Developers',
      content: 'Docker simplifies containerization...',
      status: 'draft',
      authorId: admin.id,
      categoryId: catTech.id,
      tags: {
        connectOrCreate: [
          { where: { name: 'docker' }, create: { name: 'docker' } },
        ],
      },
    } as any,
  });

  await prisma.article.create({
    data: {
      title: 'The Future of AI',
      content: 'Artificial intelligence is reshaping industries...',
      status: 'published',
      authorId: editor.id,
      categoryId: catScience.id,
    } as any,
  });

  await prisma.article.create({
    data: {
      title: 'Healthy Living Tips',
      content: 'Maintaining a healthy lifestyle requires...',
      status: 'archived',
      categoryId: catLifestyle.id,
    } as any,
  });

  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Great article!',
        articleId: article1.id,
        authorId: editor.id,
      },
    }),
    prisma.comment.create({
      data: { content: 'Very informative, thanks!', articleId: article1.id },
    }),
    prisma.comment.create({
      data: {
        content: 'Prisma is amazing!',
        articleId: article2.id,
        authorId: admin.id,
      },
    }),
  ]);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
