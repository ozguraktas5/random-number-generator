import React, { useState, useEffect, useRef, useCallback } from "react";
import { saveAs } from "file-saver";
import { useDropzone } from "react-dropzone";

// RandomNumber adlı fonksiyonel bir React bileşeni oluşturuluyor.
const RandomNumber = ({ channelCount }) => {
  // State Hook'ları kullanılarak bileşenin durumu tanımlanıyor.
  const [channelsData, setChannelsData] = useState(
    Array.from({ length: channelCount }, () => [])
  );
  const [isRunning, setIsRunning] = useState(false);
  const [intervalTime, setIntervalTime] = useState(1000);
  const [numberRange, setNumberRange] = useState({ min: 0, max: 10 });
  const [verticalScale, setVerticalScale] = useState(10);
  const [channelColors, setChannelColors] = useState(
    Array.from({ length: channelCount }, getRandomColor)
  );
  const [showNumericIndicator, setShowNumericIndicator] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(true);

  // useRef Hook'u ile channelRefs adlı bir referans oluşturuluyor.
  const channelRefs = useRef(
    channelCount &&
      Array.from({ length: channelCount }, () => React.createRef())
  );

  // getRandomColor adlı fonksiyon, rastgele renk üreten bir yardımcı fonksiyondur.
  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    return (
      "#" +
      Array.from(
        { length: 6 },
        () => letters[Math.floor(Math.random() * 16)]
      ).join("")
    );
  }

  // useCallback Hook'u ile generateRandomNumber adlı fonksiyon, bağımlılıkları değişmediği sürece aynı kalacak şekilde tanımlanıyor.
  const generateRandomNumber = useCallback(
    () =>
      Math.floor(Math.random() * (numberRange.max - numberRange.min + 1)) +
      numberRange.min,
    [numberRange]
  );

  // Jeneratörü durduran fonksiyon
  const stopGenerator = () => setIsRunning(false);

  // Jeneratörü başlatan fonksiyon
  const handleStart = () => {
    if (isFirstRun) setIsFirstRun(false);
    setIsRunning(true);
  };

  // Verileri dosya olarak kaydetme fonksiyonu
  const handleSaveAs = () => {
    const dataToSave = JSON.stringify(channelsData, null, 2);
    const blob = new Blob([dataToSave], { type: "application/json" });
    saveAs(blob, "channelsData.json");
  };

  // Yeni dosya yükleme fonksiyonu
  const handleFileUpload = (acceptedFiles) => {
    const file = acceptedFiles[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedData = JSON.parse(e.target.result);
          setChannelsData(loadedData);
        } catch (error) {
          console.error("Error loading data from file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Dropzone için stil tanımlamaları
  const dropzoneStyles = {
    borderRadius: "4px",
    textAlign: "center",
    cursor: "pointer",
    marginTop: "1px",
  };

  // Dropzone kullanımı ve özellikleri
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    accept: ".json",
  });

  // Kanal verilerini sıfırla
  useEffect(() => {
    setChannelsData(Array.from({ length: channelCount }, () => []));
  }, [channelCount]);

  // Veri üretme ve kaydırma işlemleri
  useEffect(() => {
    let interval;

    const generateData = () => {
      setChannelsData((prevChannelsData) => {
        const newChannelsData = prevChannelsData.map((channelData) =>
          channelData && channelData.length > 0
            ? [...channelData, generateRandomNumber()]
            : [generateRandomNumber()]
        );

        channelRefs.current.forEach(
          (ref, index) =>
            ref.current && (ref.current.scrollLeft = ref.current.scrollWidth)
        );

        return newChannelsData;
      });
    };

    // Jeneratör çalışıyorsa veri üretmeye devam et
    if (isRunning) interval = setInterval(generateData, intervalTime);

    // Component unmount edildiğinde interval'i temizle
    return () => clearInterval(interval);
  }, [
    isRunning,
    intervalTime,
    numberRange,
    channelsData,
    generateRandomNumber,
  ]);

  // Kanal görsellerini render etme
  const renderBars = (data, index) =>
    data.map((number, dataIndex) => (
      <div
        key={dataIndex}
        style={{
          width: "20px",
          height: `${number * verticalScale}px`,
          backgroundColor: channelColors[index],
          display: "inline-block",
          margin: "2px",
        }}
      />
    ));

  // JSX olarak component'in render edilmesi
  return (
    <div className="all">
      {Array.from({ length: channelCount }, (_, index) => (
        <div key={index} className="row">
          <h1>Kanal {index + 1}</h1>
          <div className="buttons">
            <button onClick={handleStart}>Başlat</button>
            <button onClick={stopGenerator}>Durdur</button>
            <button onClick={handleSaveAs}>Farklı Kaydet</button>
            <button onClick={handleFileUpload}>
              <div {...getRootProps()} style={dropzoneStyles}>
                <input {...getInputProps()} />
                <p>Yükle</p>
              </div>
            </button>
          </div>

          <div
            ref={channelRefs.current[index]}
            style={{
              overflowX: "scroll",
              whiteSpace: "nowrap",
              backgroundColor: "lightgray",
            }}
          >
            {renderBars(channelsData[index], index)}
          </div>
          {showNumericIndicator && (
            <div className="numbers">
              {channelsData[index].map((number, dataIndex) => (
                <span key={dataIndex} style={{ color: channelColors[index] }}>
                  {number}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="settings">
        <table>
          <tbody>
            <tr>
              <td>
                <label>Oluşturma Zaman Aralığı (ms):</label>
              </td>
              <td>
                <input
                  type="number"
                  value={intervalTime}
                  onChange={(e) =>
                    setIntervalTime(parseInt(e.target.value, 10))
                  }
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Sayı Aralığı (min-max):</label>
              </td>
              <td>
                <input
                  type="number"
                  value={numberRange.min}
                  onChange={(e) =>
                    setNumberRange({
                      ...numberRange,
                      min: parseInt(e.target.value, 10),
                    })
                  }
                />
                -
                <input
                  type="number"
                  value={numberRange.max}
                  onChange={(e) =>
                    setNumberRange({
                      ...numberRange,
                      max: parseInt(e.target.value, 10),
                    })
                  }
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Dikey Ölçeklendirme Faktörü:</label>
              </td>
              <td>
                <input
                  type="number"
                  value={verticalScale}
                  onChange={(e) =>
                    setVerticalScale(parseInt(e.target.value, 10))
                  }
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Sayısal Gösterge Göster:</label>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={showNumericIndicator}
                  onChange={() =>
                    setShowNumericIndicator(!showNumericIndicator)
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RandomNumber;
