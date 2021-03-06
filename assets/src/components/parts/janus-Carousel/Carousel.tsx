/* eslint-disable react/prop-types */
import React, { createRef, CSSProperties, useCallback, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, { Navigation, Pagination, A11y, Keyboard, Zoom } from 'swiper';
import { CapiVariableTypes } from '../../../adaptivity/capi';
import {
  NotificationType,
  subscribeToNotification,
} from '../../../apps/delivery/components/NotificationContext';
import { JanusCarouselModes } from './types';
import './Carousel.css';
const Carousel: React.FC<any> = (props) => {
  const [state, setState] = useState<any[]>(Array.isArray(props.state) ? props.state : []);
  const [model, setModel] = useState<any>(Array.isArray(props.model) ? props.model : {});
  const [ready, setReady] = useState<boolean>(false);
  const id: string = props.id;
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewedSlides, setViewedSlides] = useState<any[]>([]);
  const [captionRefs, setCaptionRefs] = useState<any[]>([]);
  const [carouselCustomCss, setCarouselCustomCss] = useState<string>('');
  const [carouselZoom, setCarouselZoom] = useState<boolean>(true);
  const [cssClass, setCssClass] = useState('');
  // initialize the swiper
  SwiperCore.use([Navigation, Pagination, A11y, Keyboard, Zoom]);
  const initialize = useCallback(async (pModel) => {
    // set defaults
    const dZoom = typeof pModel.zoom === 'boolean' ? pModel.zoom : carouselZoom;
    setCarouselZoom(dZoom);

    const dCssClass = pModel.cssClasses || cssClass;
    setCssClass(dCssClass);

    const dCustomCss = pModel.customCss || carouselCustomCss;
    setCarouselCustomCss(dCustomCss);

    const initResult = await props.onInit({
      id,
      responses: [
        {
          key: 'customCssClass',
          type: CapiVariableTypes.STRING,
          value: dCssClass,
        },
        {
          key: 'zoom',
          type: CapiVariableTypes.BOOLEAN,
          value: dZoom,
        },
        {
          key: 'customCss',
          type: CapiVariableTypes.STRING,
          value: dCustomCss,
        },
      ],
    });

    // result of init has a state snapshot with latest (init state applied)
    const currentStateSnapshot = initResult.snapshot;

    const sZoom = currentStateSnapshot[`stage.${id}.zoom`];
    if (sZoom !== undefined) {
      setCarouselZoom(sZoom);
    }

    const sCustomCss = currentStateSnapshot[`stage.${id}.customCss`];
    if (sCustomCss !== undefined) {
      setCarouselCustomCss(sCustomCss);
    }

    const sCssClass = currentStateSnapshot[`stage.${id}.customCssClass`];
    if (sCssClass !== undefined) {
      setCssClass(sCssClass);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!props.notify) {
      return;
    }
    const notificationsHandled = [
      NotificationType.CHECK_STARTED,
      NotificationType.CHECK_COMPLETE,
      NotificationType.CONTEXT_CHANGED,
      NotificationType.STATE_CHANGED,
    ];
    const notifications = notificationsHandled.map((notificationType: NotificationType) => {
      const handler = (payload: any) => {
        /* console.log(`${notificationType.toString()} notification handled [Carousel]`, payload); */
        switch (notificationType) {
          case NotificationType.CHECK_STARTED:
            // nothing to do
            break;
          case NotificationType.CHECK_COMPLETE:
            // nothing to do
            break;
          case NotificationType.STATE_CHANGED:
            {
              const { mutateChanges: changes } = payload;
              const sMode = changes[`stage.${id}.Mode`];
              if (sMode !== undefined) {
                setCarouselMode(sMode);
              }

              const sCustomCss = changes[`stage.${id}.customCss`];
              if (sCustomCss !== undefined) {
                setCarouselCustomCss(sCustomCss);
              }

              const sZoom = changes[`stage.${id}.zoom`];
              if (sZoom !== undefined) {
                setCarouselZoom(sZoom);
              }
            }
            break;
          case NotificationType.CONTEXT_CHANGED:
            // nothing to do
            break;
        }
      };
      const unsub = subscribeToNotification(props.notify, notificationType, handler);
      return unsub;
    });
    return () => {
      notifications.forEach((unsub) => {
        unsub();
      });
    };
  }, [props.notify]);

  useEffect(() => {
    let pModel;
    let pState;
    if (typeof props?.model === 'string') {
      try {
        pModel = JSON.parse(props.model);
        setModel(pModel);
      } catch (err) {
        // bad json, what do?
      }
    }
    if (typeof props?.state === 'string') {
      try {
        pState = JSON.parse(props.state);
        setState(pState);
      } catch (err) {
        // bad json, what do?
      }
    }
    if (!pModel) {
      return;
    }
    initialize(pModel);
  }, [props]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    props.onReady({ id, responses: [] });
  }, [ready]);

  const {
    title = '',
    x = 0,
    y = 0,
    z = 0,
    width,
    height,
    cssClasses = '',
    fontSize = 16,
    showOnAnswersReport = false,
    requireManualGrading = false,
    src,
    mode = JanusCarouselModes.STUDENT,
    images = [],
    customCss = '',
    zoom = false,
  } = model;

  const [carouselMode, setCarouselMode] = useState<string>(mode);

  const MAGIC_NUMBER = 64;
  const PAGINATION_HEIGHT = 32;
  const styles: CSSProperties = {
    position: 'absolute',
    top: `${y}px`,
    left: `${x}px`,
    width: `${width}px`,
    height: `${height}px`,
    fontSize: `${fontSize}px`,
    zIndex: z,
    overflow: 'hidden',
    display: 'flex',
  };
  const imgStyles: CSSProperties = {
    maxWidth: `calc(${width}px - ${MAGIC_NUMBER}px)`,
    maxHeight: imagesLoaded
      ? `calc(${height}px - ${captionRefs[currentSlide]?.current?.clientHeight}px - ${PAGINATION_HEIGHT}px)`
      : `calc(${height} - ${MAGIC_NUMBER}px)`,
  };

  useEffect(() => {
    // when images[] load, refs are set on captions in order to calc() max-height for each image later
    if (images && images.length > 0) {
      setCaptionRefs((captionRefs) =>
        Array(images.length)
          .fill(images.length)
          .map((_, i) => captionRefs[i] || createRef()),
      );
    }
  }, [images]);

  useEffect(() => {
    //TODO commenting for now. Need to revisit once state structure logic is in place
    //handleStateChange(state);
  }, [state]);

  const saveState = ({
    carouselCustomCss,
    carouselZoom,
  }: {
    carouselCustomCss: string;
    carouselZoom: boolean;
  }) => {
    const vars: any = [];
    const viewedImagesCount = [...new Set(viewedSlides)].length;
    const currentImage = currentSlide + 1;

    vars.push({
      key: `Current Image`,
      type: CapiVariableTypes.NUMBER,
      value: currentImage,
    });
    vars.push({
      key: `Viewed Images Count`,
      type: CapiVariableTypes.NUMBER,
      value: viewedImagesCount,
    });
    //BS: don't really need to save this since it won't be changed by user
    vars.push({
      key: `customCss`,
      type: CapiVariableTypes.STRING,
      value: carouselCustomCss,
    });
    vars.push({
      key: `zoom`,
      type: CapiVariableTypes.BOOLEAN,
      value: carouselZoom,
    });
    props.onSave({
      id: `${id}`,
      responses: vars,
    });
  };

  useEffect(() => {
    saveState({
      carouselCustomCss,
      carouselZoom,
    });
  }, [currentSlide]);

  const handleSlideChange = (currentSlide: any) => {
    setViewedSlides((viewedSlides) => [...viewedSlides, currentSlide]);
    setCurrentSlide(currentSlide);
  };

  return ready ? (
    <div
      data-part-component-type={props.type}
      id={id}
      className={`janus-image-carousel ${cssClass}`}
      style={styles}
    >
      {}
      {images.length > 0 && (
        <Swiper
          slidesPerView={1}
          loop
          navigation
          zoom={carouselZoom ? { maxRatio: 3 } : false}
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          onSwiper={(swiper) => {
            setCurrentSlide(swiper.realIndex);
          }}
          onSlideChange={(swiper) => {
            handleSlideChange(swiper.realIndex);
          }}
          onImagesReady={() => {
            setImagesLoaded(true);
          }}
        >
          {images.map((image: any, index: number) => (
            <SwiperSlide key={index} zoom={carouselZoom}>
              <figure className="swiper-zoom-container">
                <img style={imgStyles} src={image.url} alt={image.alt ? image.alt : undefined} />
                <figcaption ref={captionRefs[index]}>{image.caption}</figcaption>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {images.length <= 0 && <div className="no-images">No images to display</div>}
    </div>
  ) : null;
};

export const tagName = 'janus-image-carousel';

export default Carousel;
