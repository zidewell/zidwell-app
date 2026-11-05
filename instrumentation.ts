// instrumentation.ts
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { logs } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': 'zidwell-nextjs' }),
  processors: [
    new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter({
        url: new URL('/i/v1/logs', process.env.NEXT_PUBLIC_POSTHOG_HOST).toString(),
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  ],
})

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logs.setGlobalLoggerProvider(loggerProvider)
  }
}