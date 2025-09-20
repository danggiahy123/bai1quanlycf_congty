import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import Card from './Card';
import Input from './Input';
import Badge from './Badge';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { 
  PlusIcon, 
  HeartIcon, 
  StarIcon,
  EnvelopeIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error, warning, info } = useToast();

  const handleToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        success('Success!', 'Operation completed successfully');
        break;
      case 'error':
        error('Error!', 'Something went wrong');
        break;
      case 'warning':
        warning('Warning!', 'Please check your input');
        break;
      case 'info':
        info('Info', 'Here is some information');
        break;
    }
  };

  const handleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          🎨 Component Showcase
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          Khám phá các components hiện đại với animations
        </p>
      </motion.div>

      {/* Buttons Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Buttons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Variants</h3>
            <div className="space-y-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Sizes</h3>
            <div className="space-y-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">States</h3>
            <div className="space-y-2">
              <Button loading={isLoading} onClick={handleLoading}>
                {isLoading ? 'Loading...' : 'Click to Load'}
              </Button>
              <Button disabled>Disabled</Button>
              <Button icon={<PlusIcon className="w-4 h-4" />}>
                With Icon
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Cards Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" className="p-4">
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A simple card with default styling
            </p>
          </Card>
          
          <Card variant="elevated" className="p-4">
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A card with elevated shadow
            </p>
          </Card>
          
          <Card variant="outlined" className="p-4">
            <h3 className="font-semibold mb-2">Outlined Card</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A card with border outline
            </p>
          </Card>
          
          <Card variant="glass" className="p-4">
            <h3 className="font-semibold mb-2">Glass Card</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              A glass morphism card
            </p>
          </Card>
        </div>
      </Card>

      {/* Inputs Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Inputs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Email"
            type="email"
            value={inputValue}
            onChange={setInputValue}
            placeholder="Enter your email"
            icon={<EnvelopeIcon className="w-5 h-5" />}
          />
          
          <Input
            label="Password"
            type="password"
            value=""
            onChange={() => {}}
            placeholder="Enter your password"
            icon={<UserIcon className="w-5 h-5" />}
          />
          
          <Input
            label="With Error"
            value=""
            onChange={() => {}}
            error="This field is required"
            placeholder="This input has an error"
          />
          
          <Input
            label="Disabled"
            value="Disabled input"
            onChange={() => {}}
            disabled
            placeholder="This input is disabled"
          />
        </div>
      </Card>

      {/* Badges Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Badges
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Sizes</h3>
            <div className="flex flex-wrap gap-2">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Animated</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" animated>Animated</Badge>
              <Badge variant="warning" animated>Badge</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Toast Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Toast Notifications
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="success" onClick={() => handleToast('success')}>
            Success Toast
          </Button>
          <Button variant="danger" onClick={() => handleToast('error')}>
            Error Toast
          </Button>
          <Button variant="warning" onClick={() => handleToast('warning')}>
            Warning Toast
          </Button>
          <Button variant="info" onClick={() => handleToast('info')}>
            Info Toast
          </Button>
        </div>
      </Card>

      {/* Loading Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Loading States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Small</h3>
            <LoadingSpinner size="sm" color="primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Medium</h3>
            <LoadingSpinner size="md" color="primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Large</h3>
            <LoadingSpinner size="lg" color="primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">With Text</h3>
            <LoadingSpinner size="md" color="primary" text="Loading..." />
          </div>
        </div>
      </Card>

      {/* Modal Section */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Modal
        </h2>
        <div className="space-y-4">
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
          
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            size="md"
          >
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                This is an example modal with modern animations and styling.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </Card>

      {/* Animation Showcase */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Animations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-center cursor-pointer"
          >
            Hover me!
          </motion.div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg text-center"
          >
            Spinning
          </motion.div>
          
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-center"
          >
            Floating
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg text-center cursor-pointer"
          >
            Interactive
          </motion.div>
        </div>
      </Card>
    </div>
  );
};

export default ComponentShowcase;
