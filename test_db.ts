import prisma from './server/db.ts';
async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log('Success:', user);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
