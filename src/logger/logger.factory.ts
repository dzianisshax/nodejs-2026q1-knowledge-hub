import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFileModule from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// handles both default and named export shapes across CJS/ESM interop
const DailyRotateFile =
  (DailyRotateFileModule as any).default ?? DailyRotateFileModule;

const NEST_TO_WINSTON_LEVEL: Record<string, string> = {
  log: 'info',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
  verbose: 'verbose',
};

function buildFileTransport(): InstanceType<typeof DailyRotateFile> {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const maxSizeKb = parseInt(process.env.LOG_MAX_FILE_SIZE ?? '1024', 10);
  const maxSizeBytes = `${maxSizeKb}k`;

  return new DailyRotateFile({
    dirname: logsDir,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DDTHH-mm-ss',
    maxSize: maxSizeBytes,
    maxFiles: '30d',
    auditFile: path.join(logsDir, 'audit.json'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  });
}

export function createAppLogger() {
  const nestLevel = process.env.LOG_LEVEL ?? 'log';
  const winstonLevel = NEST_TO_WINSTON_LEVEL[nestLevel] ?? 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  const consoleFormat = isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.timestamp(),
        nestWinstonUtilities.format.nestLike('App', {
          prettyPrint: true,
          colors: true,
        }),
      );

  return WinstonModule.createLogger({
    level: winstonLevel,
    transports: [
      new winston.transports.Console({ format: consoleFormat }),
      buildFileTransport(),
    ],
  });
}
