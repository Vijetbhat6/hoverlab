/**
 * Getting data in — the screen between an empty product and a useful one.
 *
 * Import is the highest-stakes flow in most B2B products and the one most
 * likely to be a single file input with a spinner. The failure is never the
 * upload; it is everything either side of it. People arrive without a file
 * in the right shape, and they leave when a 40MB CSV dies at 90% on hotel
 * wifi with no way to resume.
 *
 * The order is the order it goes wrong in.
 *
 *   first question   sample data offered with equal weight, not as a greyed
 *                    afterthought. Someone evaluating the product does not
 *                    have their data yet and should not have to fake it
 *   dropzone         the obvious part
 *   from a URL       the other half of "get data in", routinely missing
 *   mapping          the screen between "file uploaded" and "data imported",
 *                    which is where every real import actually stalls
 *   requirements     stated before the failure rather than after it
 *   progress         complete, uploading, queued and failed, with retry
 *   resumable        one big file on a connection that will drop, with a
 *                    bar allowed to go backwards when a chunk is retried
 *
 * Requirements sitting *after* the mapper is deliberate and is the one
 * ordering choice here someone would argue with. Stating the constraints up
 * front reads as a wall of rules before anyone has a reason to care; stated
 * after the mapping screen, they answer a question the mapper has just made
 * concrete. The mapper is also where a person first sees their own columns,
 * which is the moment "must be UTF-8" stops being trivia.
 */

import * as React from 'react'
import { OnboardingImportData } from '@/lib/blocks/sources/onboarding-import-data'
import { FileDropzone } from '@/lib/blocks/sources/file-dropzone'
import { ImportFromUrlForm } from '@/lib/blocks/sources/import-from-url-form'
import { CsvImportMapper } from '@/lib/blocks/sources/csv-import-mapper'
import { UploadRequirementsForm } from '@/lib/blocks/sources/upload-requirements-form'
import { UploadProgressList } from '@/lib/blocks/sources/upload-progress-list'
import { UploadResumable } from '@/lib/blocks/sources/upload-resumable'

export default function ImportDataPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-5xl px-6 pb-2 pt-12">
        <h1 className="text-2xl font-bold tracking-tight">Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sample data, a file, a URL, the mapping step everything stalls on,
          and an upload that survives the connection dropping.
        </p>
      </section>

      <OnboardingImportData />
      <FileDropzone />
      <ImportFromUrlForm />

      <CsvImportMapper />
      <UploadRequirementsForm />

      <UploadProgressList />
      <UploadResumable />
    </main>
  )
}
