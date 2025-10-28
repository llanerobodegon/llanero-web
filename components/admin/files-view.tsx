import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Files, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Image, 
  FileText, 
  Video,
  Music,
  Archive
} from "lucide-react"

export function FilesView() {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'archive':
        return <Archive className="w-4 h-4" />
      default:
        return <Files className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const mockFiles = [
    { id: 1, name: 'imagen-perfil.jpg', type: 'image', size: 245760, uploadedAt: '2024-01-15' },
    { id: 2, name: 'documento.pdf', type: 'document', size: 1048576, uploadedAt: '2024-01-14' },
    { id: 3, name: 'video-demo.mp4', type: 'video', size: 15728640, uploadedAt: '2024-01-13' },
    { id: 4, name: 'audio-clip.mp3', type: 'audio', size: 3145728, uploadedAt: '2024-01-12' },
    { id: 5, name: 'backup.zip', type: 'archive', size: 52428800, uploadedAt: '2024-01-11' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archivos</h1>
          <p className="text-muted-foreground">
            Gestiona los archivos y almacenamiento
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Subir Archivo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Archivos</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              +15 esta semana
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 GB</div>
            <p className="text-xs text-muted-foreground">
              de 10 GB disponibles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imágenes</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              43% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">567</div>
            <p className="text-xs text-muted-foreground">
              20% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* File Management */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos Recientes</CardTitle>
          <CardDescription>
            Archivos subidos recientemente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar archivos..." className="pl-8" />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>
          
          {/* Files List */}
          <div className="space-y-4">
            {mockFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {file.type}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Archivos</CardTitle>
          <CardDescription>
            Arrastra y suelta archivos aquí o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Subir archivos</p>
            <p className="text-sm text-muted-foreground mb-4">
              Formatos soportados: JPG, PNG, PDF, MP4, MP3, ZIP
            </p>
            <Button>Seleccionar Archivos</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}