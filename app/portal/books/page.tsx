import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { countGroupFiles } from '@/lib/libraryTypes'
import DocumentAlbumCard from '../components/DocumentAlbumCard'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'PDF Book | Extreme Team Vault',
}

const TITLE = 'PDF Book'
const DESCRIPTION = 'Team books and long-form guides to read online.'

function countOrganizedBooks(view: Awaited<ReturnType<typeof getLibrary>>): number {
  return view.sections.reduce((sum, section) => sum + countGroupFiles(section), 0)
}

export default async function BooksPage() {
  const books = await getLibrary('books')

  if (countOrganizedBooks(books) === 0) {
    return (
      <SectionPlaceholder
        icon={BookOpen}
        title={TITLE}
        description={DESCRIPTION}
      />
    )
  }

  const categories = books.sections.filter((s) => countGroupFiles(s) > 0)

  return (
    <div className="flex flex-col gap-10">
      <PageHeader icon={BookOpen} title={TITLE} description={DESCRIPTION} />

      {categories.map((category) => {
        const albums = category.children.filter((c) => c.files.length > 0)
        return (
          <section key={category.id} className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-base font-semibold text-ink sm:text-lg">{category.name}</h2>
                {category.description && (
                  <p className="text-sm text-ink-muted">{category.description}</p>
                )}
              </div>
              <span className="shrink-0 text-sm text-ink-subtle tabular-nums">
                {countGroupFiles(category)}{' '}
                {countGroupFiles(category) === 1 ? 'book' : 'books'}
              </span>
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {category.files.length > 0 && (
                <li>
                  <DocumentAlbumCard
                    album={{ ...category, description: '' }}
                    label={albums.length > 0 ? 'More books' : undefined}
                    basePath="/portal/books"
                    countLabel={{ one: 'book', other: 'books' }}
                  />
                </li>
              )}
              {albums.map((album) => (
                <li key={album.id}>
                  <DocumentAlbumCard
                    album={album}
                    basePath="/portal/books"
                    countLabel={{ one: 'book', other: 'books' }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
