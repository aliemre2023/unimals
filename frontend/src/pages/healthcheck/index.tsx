import { GetServerSideProps } from 'next'

export default function HealthCheck() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  if (res) {
    res.setHeader('Content-Type', 'application/xml')
    res.write('<?xml version="1.0" encoding="UTF-8"?>\n<health>ok</health>')
    res.end()
  }

  return {
    props: {},
  }
}