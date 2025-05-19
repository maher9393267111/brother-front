// BlogForm.jsx with TipTap editor replacing React-Quill
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'react-query';
import { getBlogCategories, createBlog, updateBlog } from '@services/api';
import http from '@services/api/http';
import { toast } from 'react-toastify';
import { XMarkIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Switch } from "@headlessui/react";
import MediaUpload from '@components/ui/MediaUpload';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Textinput from '@components/ui/TextinputBlog';
import Textarea from '@components/ui/TextareaBlog';
import Select from '@components/ui/SelectBlog';
import BlogSeoDashboard from '@components/SEO/Blog/BlogSeoDashboard';
import MediaModal from '@components/modal/MediaModal';
import TipTapEditor from '@components/TipTapEditor'; // Import the new reusable editor

// TipTap imports - These are now primarily handled by TipTapEditor.jsx
// Keeping specific ones if BlogForm needs direct interaction, otherwise they can be removed.
// import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'; 
// import StarterKit from '@tiptap/starter-kit';
// ... other tiptap extensions ...

// TipTapToolbar is now part of TipTapEditor.jsx
// const TipTapToolbar = ({ editor }) => { ... };

// FileUpload and ImageUploadModal might still be used by BlogForm for featured/OG images,
// but not directly by the core content editor if TipTapEditor handles its own image insertions.
function FileUpload({ file, onDrop, onRemove, loading, error, maxSize }) {
  // ... (FileUpload component remains unchanged as it's for featuredImage/ogImage)
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleInputChange = (e) => {
    onDrop(e);
  };

  const handleBoxClick = () => {
    if (!loading) fileInputRef.current.click();
  };

  const getFileSize = (size) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={loading}
      />
      {!file ? (
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors min-h-[120px] cursor-pointer
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}
            ${error ? 'border-red-400 bg-red-50' : ''}
            ${loading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={handleBoxClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">
            Drag & drop image or <span className="text-primary-500 font-semibold">click to upload</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max {getFileSize(maxSize)}. Only images allowed.
          </p>
        </div>
      ) : (
        <div className="flex items-center border rounded-lg p-3 bg-gray-50 relative">
          <div className="w-20 h-20 rounded overflow-hidden flex items-center justify-center bg-gray-100 mr-4">
            <img
              src={file.url}
              alt="Preview"
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-700 truncate">
              {file.name || 'Image uploaded'}
            </div>
            <div className="text-xs text-gray-400">
              {getFileSize(file.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="ml-2 p-2 rounded-full hover:bg-red-100 text-red-600 transition"
            aria-label="Remove"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ImageUploadModal is specific to BlogForm's advanced image insertion (Media Library)
// This can remain here if TipTapEditor uses a simpler image insertion (e.g., URL prompt)
const ImageUploadModal = ({ isOpen, onClose, onInsertUrl, onFileSelect }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('url'); // 'url', 'upload', or 'library'
  const fileInputRef = useRef(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  
  if (!isOpen) return null;
  
  const handleMediaSelect = (mediaItem) => {
    if (mediaItem && mediaItem.url) {
      onInsertUrl(mediaItem.url);
      onClose(); // Close ImageUploadModal after selection
    }
    setShowMediaModal(false); // Ensure media modal closes
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">Insert Image into Content</h3>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-5">
            <div className="flex border-b mb-4">
              <button 
                type='button'
                className={`py-2 px-4 ${activeTab === 'url' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('url')}
              >
                URL
              </button>
              <button 
                type="button"
                className={`py-2 px-4 ${activeTab === 'upload' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload
              </button>
              <button 
                type="button"
                className={`py-2 px-4 ${activeTab === 'library' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('library')}
              >
                Media Library
              </button>
            </div>
            
            {activeTab === 'url' && (
              <div>
                <input 
                  type="text" 
                  placeholder="Enter image URL"
                  className="w-full border border-gray-300 rounded-md p-2 mb-4"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    type='button'
                    className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600"
                    onClick={() => {
                      if (imageUrl.trim()) {
                        onInsertUrl(imageUrl);
                        onClose();
                      }
                    }}
                  >
                    Insert
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onFileSelect(e.target.files[0]); // This might trigger an upload then insert
                      // onClose(); // Close after selection/upload trigger
                    }
                  }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-md p-8 mb-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                >
                  <PhotoIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to select an image from your computer</p>
                </div>
              </div>
            )}
            
            {activeTab === 'library' && (
              <div>
                <div className="text-center py-6">
                  <Button
                    text="Browse Media Library"
                    className="btn-primary"
                    onClick={() => setShowMediaModal(true)} // This opens the actual MediaModal
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MediaModal
        open={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect} // This will call onInsertUrl passed to ImageUploadModal
        title="Select Image from Library"
        accept="image/*"
      />
    </>
  );
};


const BlogForm = ({ initialData = null }) => {
  const router = useRouter();
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || null);
  const [ogImage, setOgImage] = useState(initialData?.ogImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState('');
  const [uploadStates, setUploadStates] = useState({});
  const [activeTab, setActiveTab] = useState('main');
  
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentType, setContentType] = useState('full');
  const [showContentModal, setShowContentModal] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationTone, setGenerationTone] = useState('professional');
  
  const [editorContent, setEditorContent] = useState(initialData?.content || '');
  
  // editorStyles are now in TipTapEditor.jsx
  // const editorStyles = ` ... `;

  // useEditor hook is now managed by TipTapEditor.jsx
  // const editor = useEditor({ ... });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm({
    defaultValues: initialData || {
      isIndexing: true,
      title: '',
      excerpt: '',
      categoryId: '',
      status: 'draft',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      robots: 'index, follow',
    },
  });

  const isIndexing = watch('isIndexing');

  const getBlogDataForSeo = () => {
    const values = getValues();
    return {
      title: values.title || '',
      metaTitle: values.metaTitle || values.title || '',
      description: values.metaDescription || values.excerpt || '',
      slug: values.slug || '',
      metaKeywords: values.metaKeywords || '',
      robots: values.robots || 'index, follow',
      ogImage: ogImage,
      contentType: 'blog',
      category: values.categoryId,
      categoryName: values.category?.name,
    };
  };

  const handleSeoSuggestions = (seoData) => {
    if (!seoData) return;
    if (seoData.applySuggestion) {
      if (seoData.preventDefault) seoData.preventDefault();
      const { type, value } = seoData;
      switch(type) {
        case 'title': setValue('metaTitle', value); toast.success('Title suggestion applied'); break;
        case 'metaDescription': setValue('metaDescription', value); toast.success('Meta description suggestion applied'); break;
        case 'keywords': setValue('metaKeywords', value); toast.success('Keywords applied'); break;
        default: break;
      }
      return;
    }
    const updates = {};
    if (seoData.analysis?.titleSuggestion && !getValues('metaTitle')) updates.metaTitle = seoData.analysis.titleSuggestion;
    if (seoData.analysis?.metaDescriptionSuggestions?.[0] && !getValues('metaDescription')) updates.metaDescription = seoData.analysis.metaDescriptionSuggestions[0];
    if (seoData.analysis?.recommendedKeywords?.length > 0 && !getValues('metaKeywords')) updates.metaKeywords = seoData.analysis.recommendedKeywords.join(', ');
    if (Object.keys(updates).length > 0) {
      Object.entries(updates).forEach(([key, value]) => setValue(key, value));
    }
  };

  const { data: categories, isLoading: loadingCategories } = useQuery('blogCategories', getBlogCategories);

  const createMutation = useMutation(createBlog, {
    onSuccess: (data) => {
      setIsSubmitting(false);
      setSavingStatus('Blog post saved successfully!');
      toast.success('Blog post created!');
      router.push('/admin/blogs');
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSavingStatus(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    }
  });

  const updateMutation = useMutation(updateBlog, {
    onSuccess: (data) => {
      setIsSubmitting(false);
      setSavingStatus('Blog post updated successfully!');
      toast.success('Blog post updated!');
      router.push('/admin/blogs');
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSavingStatus(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setEditorContent(initialData.content || ''); // Set initial content for TipTapEditor
      setFeaturedImage(initialData.featuredImage || null);
      setOgImage(initialData.ogImage || null);
    }
  }, [initialData, reset]);

  const generateBlogContent = async () => {
    setIsGeneratingContent(true);
    try {
      const formValues = getValues();
      const payload = {
        title: formValues.title,
        description: formValues.excerpt || formValues.metaDescription,
        keywords: formValues.metaKeywords,
        category: categories?.find(c => c.id.toString() === formValues.categoryId)?.name,
        contentType: contentType,
        tone: generationTone,
        customPrompt: generationPrompt || undefined,
        existingContent: editorContent, // Pass current editor content
      };
      const { data } = await http.post('/generate-blog-content', payload);
      if (data && data.generatedContent) {
        setGeneratedContent(data.generatedContent);
        setShowContentModal(true);
      } else {
        throw new Error('No content generated');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setSavingStatus(`Error generating content: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };
  
  const applyGeneratedContent = () => {
    if (!generatedContent) return;
    
    if (contentType === 'full') {
      setEditorContent(generatedContent);
    } else if (contentType === 'intro') {
      setEditorContent(generatedContent + editorContent);
    } else if (contentType === 'conclusion') {
      setEditorContent(editorContent + generatedContent);
    } else if (contentType === 'section') {
      // This is a simplification. Real insertion at cursor would need TipTap instance.
      // For now, appending. Or rely on user to copy-paste.
      setEditorContent(editorContent + "\n\n" + generatedContent); 
    }
    
    setShowContentModal(false);
    setGeneratedContent(null);
  };

  const handleFeaturedImageUpload = async (e, identifier) => {
    if (!identifier) return;
    const uploadKey = `featured-image`;
    if (e.mediaLibraryFile) {
      const mediaFile = e.mediaLibraryFile;
      const imageObj = { _id: mediaFile._id, url: mediaFile.url, fromMediaLibrary: true, mediaId: mediaFile.mediaId };
      setFeaturedImage(imageObj);
      setValue('featuredImage', imageObj);
      return;
    }
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: true, error: null } }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('addToMediaLibrary', 'true');
    formData.append('setAsInUse', 'true');
    try {
      const { data } = await http.post('/uploadfile', formData);
      const imageObj = { _id: data._id, url: data.url, fromMediaLibrary: data.fromMediaLibrary || false, mediaId: data.mediaId };
      setFeaturedImage(imageObj);
      setValue('featuredImage', imageObj);
      setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: null } }));
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload image.';
      setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: errorMessage } }));
    }
  };

  const handleRemoveFeaturedImage = async (identifier, isFromLibrary = false) => {
    const uploadKey = `featured-image`;
    if (featuredImage && featuredImage._id && !isFromLibrary && !featuredImage.fromMediaLibrary) {
      try { await http.delete(`/deletefile?fileName=${featuredImage._id}`); } catch (error) { console.error('Delete failed:', error); }
      }
    setFeaturedImage(null);
    setValue('featuredImage', null);
    setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: null } }));
  };

  const handleOgImageUpload = async (e, identifier) => {
    if (!identifier) return;
    const uploadKey = `og-image`;
    if (e.mediaLibraryFile) {
      const mediaFile = e.mediaLibraryFile;
      const imageObj = { _id: mediaFile._id, url: mediaFile.url, fromMediaLibrary: true, mediaId: mediaFile.mediaId };
      setOgImage(imageObj);
      setValue('ogImage', imageObj);
      return;
    }
    const file = e.target?.files?.[0];
    if (!file) return;
    setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: true, error: null } }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('addToMediaLibrary', 'true');
    formData.append('setAsInUse', 'true');
    try {
      const { data } = await http.post('/uploadfile', formData);
      const imageObj = { _id: data._id, url: data.url, fromMediaLibrary: data.fromMediaLibrary || false, mediaId: data.mediaId };
      setOgImage(imageObj);
      setValue('ogImage', imageObj);
      setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: null } }));
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload image.';
      setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: errorMessage } }));
    }
  };

  const handleRemoveOgImage = async (identifier, isFromLibrary = false) => {
    const uploadKey = `og-image`;
    if (ogImage && ogImage._id && !isFromLibrary && !ogImage.fromMediaLibrary) {
      try { await http.delete(`/deletefile?fileName=${ogImage._id}`); } catch (error) { console.error('Delete failed:', error); }
      }
    setOgImage(null);
    setValue('ogImage', null);
    setUploadStates((prev) => ({ ...prev, [uploadKey]: { loading: false, error: null } }));
  };

  const onSubmit = (data) => {
    if (!editorContent || editorContent === '<p></p>') {
      setSavingStatus('Content cannot be empty');
      toast.error('Content cannot be empty');
      return;
    }
    setIsSubmitting(true);
    setSavingStatus('Saving...');
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
    }
    const blogData = { ...data, content: editorContent };
    if (initialData) {
      updateMutation.mutate({ id: initialData.id, ...blogData });
    } else {
      createMutation.mutate(blogData);
    }
  };

  const getPlainTextContent = () => {
    if (!editorContent) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    return tempDiv.textContent || '';
  };
  
  // This state will manage the content for TipTapEditor
  const handleEditorChange = (newContent) => {
    setEditorContent(newContent);
  };


  return (
    <div className="flex flex-col space-y-6">
      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 font-medium text-sm focus:outline-none ${activeTab === 'main' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('main')}
        >
          Blog Content
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm focus:outline-none ${activeTab === 'seo' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('seo')}
        >
          SEO & Optimization
        </button>
        <button
          className={`py-3 px-6 font-medium text-sm focus:outline-none ${activeTab === 'preview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {activeTab === 'main' && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl rounded-xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Blog Information</h2>
                <div className="mb-6">
                  <Textinput label="Title" name="title" placeholder="Enter blog title" required error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
                </div>
                <div className="mb-6">
                  <Select label="Category" name="categoryId" required error={errors.categoryId?.message} {...register('categoryId', { required: 'Category is required' })}>
                    <option value="">Select a category</option>
                    {categories?.map((category) => (<option key={category.id} value={category.id.toString()}>{category.name}</option>))}
                  </Select>
                </div>
                <div className="mb-6">
                  <Textarea label="Excerpt/Summary" name="excerpt" placeholder="Brief summary of the blog (optional)" rows={3} helperText="If left empty, an excerpt will be generated from the beginning of your content." {...register('excerpt')} />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                  <MediaUpload file={featuredImage} onDrop={(e) => handleFeaturedImageUpload(e, 'featuredImage')} onRemove={() => handleRemoveFeaturedImage('featuredImage', featuredImage?.fromMediaLibrary)} loading={uploadStates['featured-image']?.loading} error={uploadStates['featured-image']?.error} identifier='featuredImage' helperText="Featured image for your blog post" />
                </div>
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 mb-4">
                    <div className="flex items-center mb-3">
                      <SparklesIcon className="h-6 w-6 text-indigo-600 mr-2" />
                      <h3 className="text-md font-semibold text-indigo-800">AI Content Generation</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                        <select className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                          <option value="full">Full Blog Post</option>
                          <option value="intro">Introduction</option>
                          <option value="section">Blog Section</option>
                          <option value="conclusion">Conclusion</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Writing Tone</label>
                        <select className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={generationTone} onChange={(e) => setGenerationTone(e.target.value)}>
                          <option value="professional">Professional</option>
                          <option value="conversational">Conversational</option>
                          <option value="authoritative">Authoritative</option>
                          <option value="friendly">Friendly</option>
                          <option value="educational">Educational</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button text={isGeneratingContent ? "Generating..." : "Generate Content"} className="btn-primary bg-gradient-to-r from-indigo-500 to-purple-600 w-full" icon="Sparkles" onClick={generateBlogContent} disabled={isGeneratingContent || !watch('title')} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom Prompt (Optional)</label>
                      <textarea className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Add specific instructions for the AI content generation" rows={2} value={generationPrompt} onChange={(e) => setGenerationPrompt(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                  <TipTapEditor 
                    content={editorContent} 
                    onChange={handleEditorChange} 
                    placeholder="Start writing your blog post..." 
                  />
                  {(!editorContent || editorContent === '<p></p>') && savingStatus.includes('Content cannot be empty') && (
                    <p className="mt-1 text-sm text-red-600">Content is required</p>
                  )}
                </div>
                <div className="mb-6">
                  <Select label="Status" name="status" {...register('status')}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Select>
                </div>
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl rounded-xl mb-6">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">SEO Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Textinput label="Meta Title" name="metaTitle" placeholder="Meta title for SEO (defaults to blog title if empty)" helperText="Recommended length: 50-60 characters" {...register('metaTitle')} />
                  <Textinput label="Canonical URL" name="canonicalUrl" placeholder="https://example.com/blog/canonical-url" helperText="Optional: Use this to specify the preferred URL for SEO" {...register('canonicalUrl')} />
                </div>
                <div className="mb-6">
                  <Textarea label="Meta Description" name="metaDescription" placeholder="Meta description for SEO (defaults to excerpt if empty)" rows={3} helperText="Recommended length: 150-160 characters" {...register('metaDescription')} />
                </div>
                <div className="mb-6">
                  <Textinput label="Meta Keywords" name="metaKeywords" placeholder="Comma-separated keywords" {...register('metaKeywords')} />
                </div>
                <div className="mb-6">
                  <Select label="Robots Meta Tag" name="robots" {...register('robots')}>
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </Select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image</label>
                  <p className="mb-2 text-xs text-gray-500">This image will be used when sharing on social media. If not provided, featured image will be used.</p>
                  <MediaUpload file={ogImage} onDrop={(e) => handleOgImageUpload(e, 'ogImage')} onRemove={() => handleRemoveOgImage('ogImage', ogImage?.fromMediaLibrary)} loading={uploadStates['og-image']?.loading} error={uploadStates['og-image']?.error} identifier='ogImage' helperText="Recommended size: 1200x630px" />
                </div>
              </div>
            </Card>
            <BlogSeoDashboard pageData={getBlogDataForSeo()} content={getPlainTextContent()} onUpdateSuggestions={handleSeoSuggestions} />
          </div>
        )}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl rounded-xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Blog Preview</h2>
                <div className="border rounded-lg overflow-hidden">
                  {featuredImage && (<div className="aspect-video w-full overflow-hidden"><img src={featuredImage.url} alt={watch('title') || 'Blog featured image'} className="w-full h-full object-cover" /></div>)}
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{watch('title') || 'Blog Title'}</h1>
                    <div className="text-sm text-gray-500 mb-4">
                      Category: {categories?.find(c => c.id.toString() === watch('categoryId'))?.name || initialData?.category?.name}
                      {' · '}
                      Status: <span className={`${watch('status') === 'published' ? 'text-green-600' : 'text-amber-600'}`}>{watch('status') === 'published' ? 'Published' : 'Draft'}</span>
                    </div>
                    <div className="text-gray-700 mb-4">{watch('excerpt') || 'No excerpt provided'}</div>
                    <div className="prose max-w-none border-t pt-4 mt-4"><div dangerouslySetInnerHTML={{ __html: editorContent }} /></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        {savingStatus && (<div className={`mb-6 p-3 rounded ${savingStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{savingStatus}</div>)}
        <div className="bg-white p-4 border border-gray-200 rounded-lg mt-6 sticky bottom-0 z-10 shadow-md">
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-end sm:space-x-3 sm:space-y-0">
            <label className="flex items-center">
              <Switch checked={isIndexing} onChange={(checked) => setValue('isIndexing', checked)} className={`${isIndexing ? 'bg-primary-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}>
                <span className="sr-only">Enable Google Indexing</span>
                <span className={`${isIndexing ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </Switch>
              <span className="text-gray-700 font-medium ml-3">Enable Google Indexing</span>
            </label>
            <Button text='Cancel' className='btn-outline-dark' onClick={() => router.push('/admin/blogs')} type='button' />
            <Button text={isSubmitting ? 'Saving...' : initialData ? 'Update Blog' : 'Create Blog'} className='btn-primary' disabled={isSubmitting} type='submit' icon={initialData ? 'Check' : 'Plus'} isLoading={isSubmitting} />
          </div>
        </div>
      </form>
      {showContentModal && generatedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-100 animate-fadeIn">
            <div className="p-4 border-b bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center"><SparklesIcon className="h-5 w-5 mr-2" /> AI Generated Content</h3>
              <button onClick={() => setShowContentModal(false)} className="text-white hover:text-gray-200 bg-white bg-opacity-20 rounded-full p-1"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-h-[50vh] overflow-auto"><div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent }}></div></div>
              <div className="flex justify-end space-x-4">
                <Button text="Discard" className="btn-outline-gray" onClick={() => setShowContentModal(false)} />
                <Button text="Apply Content" className="btn-primary bg-gradient-to-r from-indigo-500 to-purple-600" icon="CheckCircle" onClick={applyGeneratedContent} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogForm;