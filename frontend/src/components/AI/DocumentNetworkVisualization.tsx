import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  Chip,
  Tooltip,
  alpha
} from '@mui/material';
import AIService from '../../services/ai-service';

// Types for document visualization
interface DocumentNode {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
}

// API response types
interface ApiDocumentNode {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface ApiConnection {
  source: string;
  target: string;
  strength: number;
}

interface DocumentNetworkVisualizationProps {
  documents?: DocumentNode[];
  loading?: boolean;
  title?: string;
}

/**
 * A 2D network visualization for document relationships using SVG
 * This provides an interactive SVG-based approach for visualizing document connections
 */
const DocumentNetworkVisualization: React.FC<DocumentNetworkVisualizationProps> = ({ 
  documents = [], 
  loading: propLoading = false,
  title = "Document Network Visualization" 
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(propLoading);
  const [apiDocuments, setApiDocuments] = useState<ApiDocumentNode[]>([]);
  const [apiConnections, setApiConnections] = useState<ApiConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 400;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const radius = Math.min(centerX, centerY) * 0.7;

  // Fetch document relationships from API
  useEffect(() => {
    const fetchDocumentRelationships = async () => {
      try {
        setIsLoading(true);
        // In a production environment, uncomment this code:
        // const data = await AIService.getDocumentRelationships();
        // setApiDocuments(data.nodes);
        // setApiConnections(data.connections);

        // For now, use mock data that matches our API structure
        setTimeout(() => {
          setApiDocuments([
            { id: 'doc1', name: 'Invoice #1234', type: 'invoice', size: 10 },
            { id: 'doc2', name: 'Contract A', type: 'contract', size: 15 },
            { id: 'doc3', name: 'Email Thread', type: 'email', size: 8 },
            { id: 'doc4', name: 'Report Q2', type: 'report', size: 12 },
            { id: 'doc5', name: 'Invoice #5678', type: 'invoice', size: 10 },
            { id: 'doc6', name: 'Contract B', type: 'contract', size: 14 },
            { id: 'doc7', name: 'Meeting Notes', type: 'notes', size: 7 }
          ]);
          setApiConnections([
            { source: 'doc1', target: 'doc2', strength: 0.8 },
            { source: 'doc1', target: 'doc5', strength: 0.5 },
            { source: 'doc2', target: 'doc4', strength: 0.7 },
            { source: 'doc3', target: 'doc4', strength: 0.6 },
            { source: 'doc2', target: 'doc6', strength: 0.9 },
            { source: 'doc4', target: 'doc7', strength: 0.4 },
            { source: 'doc6', target: 'doc7', strength: 0.5 }
          ]);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        console.error('Error fetching document relationships:', err);
        setError('Failed to load document relationships');
        setIsLoading(false);
      }
    };

    fetchDocumentRelationships();
  }, []);

  // Convert API data to our DocumentNode format
  const visualizationDocuments: DocumentNode[] = apiDocuments.map(node => ({
    id: node.id,
    title: node.name,
    category: node.type,
    relevanceScore: node.size / 15 // Normalize to 0-1 range
  }));

  // Calculate positions for document nodes in a circle
  const documentPositions = visualizationDocuments.reduce((acc, doc, i) => {
    const angle = (i / visualizationDocuments.length) * Math.PI * 2;
    acc[doc.id] = [
      centerX + Math.sin(angle) * radius,
      centerY + Math.cos(angle) * radius
    ];
    return acc;
  }, {} as Record<string, number[]>);

  // Handle document selection
  const handleDocumentClick = (docId: string) => {
    console.log(`Document clicked: ${docId}`);
    setSelectedDocId(docId === selectedDocId ? null : docId);
    // In a real implementation, this would fetch document details
  };

  // Get color based on document category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'invoice':
        return '#DB4437'; // Red
      case 'contract':
        return '#0F9D58'; // Green
      case 'report':
        return '#F4B400'; // Yellow
      case 'email':
        return '#4285F4'; // Blue
      case 'notes':
        return '#9334E6'; // Purple
      default:
        return '#9334E6'; // Purple
    }
  };

  // Define styles to avoid TypeScript complexity issues
  const selectedDocTooltipStyles = {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    maxWidth: '200px'
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        height: 400,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        mb: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Typography 
        variant="h5" 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          color: theme.palette.mode === 'dark' ? '#fff' : '#333',
          zIndex: 1, 
          textShadow: '0 0 10px rgba(0,0,0,0.2)'
        }}
      >
        {title}
      </Typography>
      
      {selectedDocId && (
        <Box sx={selectedDocTooltipStyles}>
          <Typography variant="body2" fontWeight="bold">
            {visualizationDocuments.find(d => d.id === selectedDocId)?.title}
          </Typography>
          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
            Click on another document to see relationships or click the same document to deselect.
          </Typography>
        </Box>
      )}
      
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Connection lines between documents */}
          {apiConnections.map((connection, i) => {
            const sourcePos = documentPositions[connection.source];
            const targetPos = documentPositions[connection.target];
            
            if (!sourcePos || !targetPos) return null;
            
            const isHighlighted = selectedDocId === connection.source || selectedDocId === connection.target;
            const opacity = isHighlighted ? 0.8 : 0.2;
            const strokeWidth = isHighlighted ? 2 : 1;
            
            return (
              <line
                key={`conn-${i}`}
                x1={sourcePos[0]}
                y1={sourcePos[1]}
                x2={targetPos[0]}
                y2={targetPos[1]}
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            );
          })}
          
          {/* Lines from center to documents */}
          {visualizationDocuments.map((doc, i) => {
            const pos = documentPositions[doc.id];
            if (!pos) return null;
            
            const isHighlighted = selectedDocId === doc.id;
            const opacity = isHighlighted ? 0.8 : 0.3;
            
            return (
              <line
                key={`center-${i}`}
                x1={centerX}
                y1={centerY}
                x2={pos[0]}
                y2={pos[1]}
                stroke="#ffffff"
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={opacity}
              />
            );
          })}
          
          {/* Center AI node with enhanced visual effects */}
          <g>
            {/* Outer glow */}
            <circle
              cx={centerX}
              cy={centerY}
              r={30}
              fill="url(#centerNodeGlow)"
              opacity={0.3}
              filter="url(#pulse)"
            />
            
            {/* Main node */}
            <circle
              cx={centerX}
              cy={centerY}
              r={20}
              fill="#4285F4"
              opacity={0.9}
              filter="url(#glow)"
            >
              {/* Subtle pulsing animation */}
              <animate 
                attributeName="r" 
                values="20;22;20"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Concentric ring for effect */}
            <circle
              cx={centerX}
              cy={centerY}
              r={15}
              fill="none"
              stroke="white"
              strokeWidth="1"
              opacity={0.7}
            >
              <animate 
                attributeName="r" 
                values="15;20;15"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate 
                attributeName="opacity" 
                values="0.7;0.2;0.7"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* AI text */}
            <text
              x={centerX}
              y={centerY + 5}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              filter="url(#textGlow)"
            >
              AI
            </text>
          </g>
          
          {/* Document nodes */}
          {visualizationDocuments.map((doc, i) => {
            const pos = documentPositions[doc.id];
            if (!pos) return null;
            
            const color = getCategoryColor(doc.category);
            const isSelected = selectedDocId === doc.id;
            const scale = 0.5 + doc.relevanceScore * 0.5; // Scale based on relevance
            const size = 12 * scale;
            
            return (
              <g 
                key={`doc-${i}`}
                transform={`translate(${pos[0]}, ${pos[1]})`}
                onClick={() => handleDocumentClick(doc.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Add subtle glow effect */}
                <circle
                  r={size + 3}
                  fill="url(#nodeGlow)"
                  opacity={isSelected ? 0.6 : 0.2}
                  filter="url(#blur)"
                />
                
                {/* Main document circle */}
                <circle
                  r={size}
                  fill={color}
                  opacity={0.8}
                  stroke={isSelected ? "white" : "none"}
                  strokeWidth={isSelected ? 2 : 0}
                  filter={isSelected ? "url(#glow)" : "none"}
                >
                  {/* Add hover animation */}
                  <animate 
                    attributeName="r" 
                    values={`${size};${size * 1.05};${size}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Document label */}
                <text
                  y={size + 15}
                  textAnchor="middle"
                  fill={isSelected ? "#ffffff" : "#cccccc"}
                  fontSize={isSelected ? 12 : 10}
                  fontWeight={isSelected ? "bold" : "normal"}
                  filter={isSelected ? "url(#textGlow)" : "none"}
                >
                  {doc.title.length > 20 ? doc.title.substring(0, 20) + '...' : doc.title}
                </text>
                
                {/* Category indicator */}
                <text
                  y={size + 30}
                  textAnchor="middle"
                  fill={isSelected ? alpha(color, 0.9) : alpha(color, 0.6)}
                  fontSize={8}
                  fontWeight="normal"
                >
                  {doc.category}
                </text>
              </g>
            );
          })}
          
          {/* SVG filters for glow effects */}
          <defs>
            {/* Glow effect for circles */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Soft blur for background glow */}
            <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            
            {/* Subtle text glow for better readability */}
            <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feFlood floodColor="rgba(0,0,0,0.5)" result="color"/>
              <feComposite in="color" in2="blur" operator="in" result="shadow"/>
              <feMerge>
                <feMergeNode in="shadow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradient for node glows */}
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="white" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
            
            {/* Center node glow effect */}
            <radialGradient id="centerNodeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#4285F4" stopOpacity="1"/>
              <stop offset="80%" stopColor="#4285F4" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#4285F4" stopOpacity="0"/>
            </radialGradient>
            
            {/* Animated pulse effect */}
            <filter id="pulse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3">
                <animate 
                  attributeName="stdDeviation"
                  values="1;3;1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </feGaussianBlur>
            </filter>
          </defs>
        </svg>
      </Box>
      
      {(isLoading || propLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2,
            color: 'white',
          }}
        >
          <Typography variant="h6" component="h2">Loading visualization...</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DocumentNetworkVisualization;