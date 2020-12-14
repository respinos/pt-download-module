<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="exsl">

  <!-- Global Variables -->
  <xsl:variable name="gHtId" select="/MBooksTop/MBooksGlobals/HtId"/>
  <xsl:variable name="gAccessUseHeader" select="/MBooksTop/MBooksGlobals/AccessUse/Header"/>
  <xsl:variable name="gAccessUseLink" select="/MBooksTop/MBooksGlobals/AccessUse/Link"/>
  <xsl:variable name="gAccessUseAuxLink" select="/MBooksTop/MBooksGlobals/AccessUse/AuxLink"/>
  <xsl:variable name="gAccessUseIcon" select="/MBooksTop/MBooksGlobals/AccessUse/Icon"/>
  <xsl:variable name="gAccessUseAuxIcon" select="/MBooksTop/MBooksGlobals/AccessUse/AuxIcon"/>
  <xsl:variable name="gHasOcr" select="/MBooksTop/MBooksGlobals/HasOcr"/>
  <xsl:variable name="gSSD_Session" select="/MBooksTop/MBooksGlobals/SSDSession"/>
  <xsl:variable name="gPodUrl" select="/MBooksTop/MBooksGlobals/Pod/Url"/>
  <xsl:variable name="gSkin" select="/MBooksTop/MBooksGlobals/Skin"/>
  <xsl:variable name="gSdrInst" select="/MBooksTop/MBooksGlobals/EnvSDRINST"/>
  <xsl:variable name="gRightsAttribute" select="/MBooksTop/MBooksGlobals/RightsAttribute"/>
  <xsl:variable name="gSourceAttribute" select="/MBooksTop/MBooksGlobals/SourceAttribute"/>
  <xsl:variable name="gMdpMetadata" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record"/>
  <xsl:variable name="gItemFormat" select="/MBooksTop/MBooksGlobals/ItemFormat"/>
  <xsl:variable name="gHasMARCAuthor" select="$gMdpMetadata/datafield[@tag='100']/subfield or $gMdpMetadata/datafield[@tag='110']/subfield or $gMdpMetadata/datafield[@tag='111']/subfield"/>
  <xsl:variable name="gItemHandle" select="/MBooksTop/MBooksGlobals/ItemHandle"/>
  <xsl:variable name="gLoggedIn" select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  <xsl:variable name="gHathiTrustAffiliate" select="/MBooksTop/MBooksGlobals/HathiTrustAffiliate"/>
  <xsl:variable name="gMichiganAffiliate" select="/MBooksTop/MBooksGlobals/MichiganAffiliate"/>
  <xsl:variable name="gIsInLibrary" select="/MBooksTop/MBooksGlobals/InLibrary/Status"/>
  <xsl:variable name="gCurrentQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
  <xsl:variable name="gContactEmail" select="/MBooksTop/MBooksGlobals/ContactEmail"/>
  <xsl:variable name="gContactText" select="/MBooksTop/MBooksGlobals/ContactText"/>
  <xsl:variable name="gVersionLabel" select="/MBooksTop/MBooksGlobals/VersionLabel"/>
  <xsl:variable name="gCatalogRecordNo" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record/controlfield[@tag='001']"/>
  <xsl:variable name="gTitleString" select="/MBooksTop/MBooksGlobals/VolumeTitle"/>
  <xsl:variable name="gVolumeTitleFragment">
    <xsl:choose>
      <xsl:when test="normalize-space(/MBooksTop/MBooksGlobals/VolCurrTitleFrag)">
        <xsl:value-of select="concat(' ', /MBooksTop/MBooksGlobals/VolCurrTitleFrag, '.')"/>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="' '"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gSinglePagePdfAccess" select="/MBooksTop/MdpApp/AllowSinglePagePDF"/>
  <xsl:variable name="gFullPdfAccess" select="/MBooksTop/MdpApp/AllowFullPDF"/>
  <xsl:variable name="gFullPdfAccessMessage" select="/MBooksTop/MdpApp/FullPDFAccessMessage"/>
  <xsl:variable name="gCollectionList" select="/MBooksTop/MdpApp/CollectionList"/>
  <xsl:variable name="gCollectionForm" select="/MBooksTop/MdpApp/AddToCollectionForm"/>

  <xsl:variable name="gUsingSearch" select="string(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='page'] = 'search')"/>

  <xsl:variable name="gTitleTruncAmt">
    <xsl:choose>
      <xsl:when test="$gVolumeTitleFragment!=' '">
        <xsl:value-of select="'40'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'50'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gTruncTitleString">
    <xsl:call-template name="GetMaybeTruncatedTitle">
      <xsl:with-param name="titleString" select="$gTitleString"/>
      <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
      <xsl:with-param name="maxLength" select="$gTitleTruncAmt"/>
    </xsl:call-template>
  </xsl:variable>

  <xsl:variable name="gFullTitleString">
    <xsl:value-of select="concat($gTitleString, ', ', $gVolumeTitleFragment)"/>
  </xsl:variable>

  <xsl:template name="get-feedback-id"></xsl:template>
  <xsl:template name="get-feedback-m"><xsl:text>pt</xsl:text></xsl:template>

  <xsl:template name="setup-html-data-attributes">
    <xsl:variable name="items" select="//MBooksGlobals/Collections/Item" />
    <xsl:if test="$items">
      <xsl:attribute name="data-anlaytics-dimension">
        <xsl:text>dimension2=</xsl:text>
        <xsl:text>:</xsl:text>
        <xsl:for-each select="$items">
          <xsl:value-of select="." />
          <xsl:text>:</xsl:text>
        </xsl:for-each>
      </xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-item-type"><xsl:value-of select="//MBooksGlobals/ItemType" /></xsl:attribute>
  </xsl:template>

  <!-- Navigation bar -->
  <xsl:template name="subnav_header">

    <div id="mdpItemBar">
      <div id="ItemBarContainer">
        <!-- Back to Search Results -->
        <xsl:if test="normalize-space(//SearchForm/SearchResultsLink) or normalize-space(//InItemResultsLink)">
          <xsl:call-template name="BuildBackToResultsLink" />
        </xsl:if>

        <!-- Search -->
        <div id="mdpSearch" role="search">
          <xsl:call-template name="BuildSearchForm">
            <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
          </xsl:call-template>
        </div>
      </div>
    </div>

  </xsl:template>

  <!-- FOAF: primary topic -->
  <xsl:variable name="gFOAFPrimaryTopicId">
    <xsl:value-of select="concat('[_:', $gHtId, ']')"/>
  </xsl:variable>

  <!-- RDFa: link -->
  <xsl:template name="BuildRDFaLinkElement">
    <xsl:element name="link">
      <xsl:attribute name="about"><xsl:value-of select="$gFOAFPrimaryTopicId"/></xsl:attribute>
      <xsl:attribute name="rel">foaf:isPrimaryTopicOf</xsl:attribute>
      <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
    </xsl:element>
  </xsl:template>


  <!-- schema org: start -->
  <xsl:template name="BuildSchemaOrgTitle">
    <xsl:param name="title"/>

    <xsl:element name="span">
    <xsl:attribute name="itemprop">name</xsl:attribute><xsl:value-of select="$title"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="BuildSchemaOrgAuthor">

    <xsl:variable name="author">
      <xsl:call-template name="MetadataAuthorHelper"/>
    </xsl:variable>

    <xsl:element name="span">
    <xsl:attribute name="itemprop">author</xsl:attribute><xsl:value-of select="$author"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="BuildSchemaOrgUrl">
    <xsl:element name="span">
    <xsl:attribute name="itemprop">url</xsl:attribute><xsl:value-of select="$gItemHandle"/>
    </xsl:element>
  </xsl:template>
  <!-- schema org: end -->

  <!-- RDFa: hidden_title_string wrapped in content-less span -->
  <xsl:template name="BuildRDFaWrappedTitle">
    <xsl:param name="visible_title_string"/>
    <xsl:param name="hidden_title_string"/>

    <!-- visible -->
    <xsl:element name="span">
      <xsl:attribute name="about"><xsl:value-of select="$gFOAFPrimaryTopicId"/></xsl:attribute>
      <xsl:attribute name="property">dc:title</xsl:attribute>
      <xsl:attribute name="rel">dc:type</xsl:attribute>
      <xsl:attribute name="href">http://purl.org/dc/dcmitype/Text</xsl:attribute>
      <xsl:attribute name="content"><xsl:value-of select="$hidden_title_string"/></xsl:attribute>
      <xsl:value-of select="$visible_title_string"/>
    </xsl:element>
  </xsl:template>

  <!-- RDFa: author -->
  <xsl:template name="BuildRDFaWrappedAuthor">
    <xsl:param name="visible"/>

    <xsl:variable name="author">
      <xsl:call-template name="MetadataAuthorHelper"/>
    </xsl:variable>

    <!-- not ever visible -->
    <xsl:if test="$gItemFormat='BK'">
      <xsl:element name="span">
        <xsl:attribute name="property">cc:attributionName</xsl:attribute>
        <xsl:attribute name="rel">cc:attributionURL</xsl:attribute>
        <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
        <!--xsl:attribute name="content"--> <!-- So it will be seen by CC scraper -->
          <xsl:value-of select="$author"/>
        <!--/xsl:attribute-->
      </xsl:element>
    </xsl:if>

    <!-- maybe visible -->
    <xsl:element name="span">
      <xsl:attribute name="property">dc:creator</xsl:attribute>
      <xsl:attribute name="content">
        <xsl:value-of select="$author"/>
      </xsl:attribute>
      <xsl:if test="$visible = 'visible'">
        <xsl:value-of select="$author"/>
      </xsl:if>
    </xsl:element>

  </xsl:template>

  <!-- RDFa: published -->
  <xsl:template name="BuildRDFaWrappedPublished">
    <xsl:param name="visible"/>

    <xsl:variable name="published">
      <xsl:call-template name="MetadataPublishedHelper"/>
    </xsl:variable>

    <!-- not ever visible -->
    <xsl:if test="$gItemFormat='SE'">
      <xsl:element name="span">
        <xsl:attribute name="property">cc:attributionName</xsl:attribute>
        <xsl:attribute name="rel">cc:attributionURL</xsl:attribute>
        <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
        <xsl:attribute name="content">
          <xsl:value-of select="$published"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:if>

    <!-- maybe visible -->
    <xsl:element name="span">
      <xsl:attribute name="property">dc:publisher</xsl:attribute>
      <xsl:attribute name="content">
        <xsl:value-of select="$published"/>
      </xsl:attribute>
      <xsl:if test="$visible = 'visible'">
        <xsl:value-of select="$published"/>
      </xsl:if>
    </xsl:element>
  </xsl:template>

  <!-- RDFa: description -->
  <xsl:template name="BuildRDFaWrappedDescription">
    <xsl:param name="visible"/>

    <xsl:if test="$gMdpMetadata/datafield[@tag='300']/subfield">

      <xsl:variable name="description">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='a']"/>
        &#x20;
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='b']"/>
        &#x20;
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='c']"/>
      </xsl:variable>

      <xsl:element name="span">
        <xsl:attribute name="property">dc:description</xsl:attribute>
        <xsl:attribute name="content">
          <xsl:value-of select="$description" />
        </xsl:attribute>
        <xsl:if test="$visible = 'visible'">
          <xsl:value-of select="$description" />
        </xsl:if>
      </xsl:element>
    </xsl:if>

  </xsl:template>

  <!-- RDFa: license -->
  <xsl:template name="BuildRDFaCCLicenseMarkup">
    <xsl:variable name="access_use_header">
      <xsl:value-of select="$gAccessUseHeader"/><xsl:text>. </xsl:text>
    </xsl:variable>

    <!-- Link text to the default HT.org page -->
    <xsl:element name="a">
      <xsl:attribute name="target">
        <xsl:text>_blank</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="href">
        <xsl:value-of select="$gAccessUseLink"/>
      </xsl:attribute>
      <xsl:value-of select="$access_use_header"/>
    </xsl:element>

    <xsl:if test="$gItemFormat='BK' and $gAccessUseAuxLink!=''">
      <xsl:element name="a">
        <xsl:attribute name="href"><xsl:value-of select="$gAccessUseAuxLink"/></xsl:attribute>
        <xsl:attribute name="rel">license</xsl:attribute>
      </xsl:element>
    </xsl:if>

    <xsl:if test="$gAccessUseIcon != '' or ( $gAccessUseAuxLink != '' and $gAccessUseAuxIcon != '' )">
      <br /><br />
    </xsl:if>

    <!-- If there's a default icon, link it default HT.org page -->
    <xsl:if test="$gAccessUseIcon!=''">
      <xsl:element name="a">
        <xsl:attribute name="target">
          <xsl:text>_blank</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="$gAccessUseLink"/>
        </xsl:attribute>
        <xsl:element name="img">
          <xsl:attribute name="src">
            <xsl:value-of select="$gAccessUseIcon"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:element>
    </xsl:if>

    <!-- (CC): If there's an auxillary icon, link it using auxillary link -->
    <xsl:if test="$gAccessUseAuxLink!='' and $gAccessUseAuxIcon!=''">
      <xsl:element name="a">
        <xsl:attribute name="target">
          <xsl:text>_blank</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="$gAccessUseAuxLink"/>
        </xsl:attribute>
        <xsl:element name="img">
          <xsl:attribute name="src">
            <xsl:value-of select="$gAccessUseAuxIcon"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:element>
    </xsl:if>

  </xsl:template>

  <!-- METADATA: All journal links -->
  <xsl:template name="BuildAllJournalLinksPopup">

  </xsl:template>

  <!-- METADATA: author metadata helper -->
  <xsl:template name="MetadataAuthorHelper">
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='100']">
      <xsl:if test="subfield[@code='a']">
        <xsl:value-of select="subfield[@code='a']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='b']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='b']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='c']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='c']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='e']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='e']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='q']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='q']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='d']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='d']"/>
      </xsl:if>
    </xsl:for-each>

    <xsl:for-each select="$gMdpMetadata/datafield[@tag='110']">
      <xsl:value-of select="subfield[@code='a']"/>
      <xsl:if test="subfield[@code='b']">
        <xsl:text>&#32;</xsl:text>
        <xsl:value-of select="subfield[@code='c']"/>
      </xsl:if>
    </xsl:for-each>

    <xsl:for-each select="$gMdpMetadata/datafield[@tag='111']">
      <xsl:value-of select="subfield[@code='a']"/>
    </xsl:for-each>

  </xsl:template>

  <!-- METADATA: published metadata helper -->
  <xsl:template name="MetadataPublishedHelper">
    <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='260'])">
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='a']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='a']"/>
        &#x20;
      </xsl:if>
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='b']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='b']"/>
        &#x20;
      </xsl:if>
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='c']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='c']"/>
      </xsl:if>
    </xsl:if>
    <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='264'])">
      <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='260'])"><xsl:text> / </xsl:text></xsl:if>
      <xsl:for-each select="$gMdpMetadata/datafield[@tag='264']/subfield">
        <xsl:value-of select="." />
        <xsl:if test="position() != last()"><xsl:text> </xsl:text></xsl:if>
      </xsl:for-each>
    </xsl:if>

  </xsl:template>

  <!-- METADATA: MDP-style metadata helper -->
  <xsl:template name="MdpMetadataHelper">
    <xsl:param name="ssd"/>
    <div id="mdpFlexible_1">

      <xsl:if test="$gHasMARCAuthor">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Author&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:call-template name="BuildRDFaWrappedAuthor">
              <xsl:with-param name="visible" select="'visible'"/>
            </xsl:call-template>
          </div>
        </div>
      </xsl:if>

      <xsl:if test="$gMdpMetadata/datafield[@tag='250']/subfield">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Edition&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='250']/subfield"/>
          </div>
        </div>
      </xsl:if>

      <div class="mdpMetaDataRow">
        <div class="mdpMetaDataRegionHead">
          <xsl:text>Published&#xa0;</xsl:text>
        </div>
        <div class="mdpMetaText">
          <xsl:call-template name="BuildRDFaWrappedPublished">
            <xsl:with-param name="visible" select="'visible'"/>
          </xsl:call-template>
        </div>
      </div>

      <xsl:if test="$gMdpMetadata/datafield[@tag='300']/subfield">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Description&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='a']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='b']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='c']"/>
          </div>
        </div>
      </xsl:if>

      <div class="mdpMetaDataRow">
        <div class="mdpMetaDataRegionHead">
          <xsl:text>Copyright&#xa0;</xsl:text>
        </div>
        <div class="mdpMetaText">
          <xsl:call-template name="BuildRDFaCCLicenseMarkup"/>
        </div>
      </div>

      <!-- allow SSD user to link from SSDviewer to pageturner if desired -->
      <xsl:choose>
        <xsl:when test="$ssd">
          <xsl:call-template name="PermanentURL">
            <xsl:with-param name="ssd" select="$ssd"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="PermanentURL"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>


  <xsl:template name="PermanentURL">
    <xsl:param name="ssd"/>
    <div class="mdpMetaDataRow">
      <div class="mdpMetaDataRegionHead">
        <xsl:text>Permanent URL&#xa0;</xsl:text>
      </div>
      <div class="mdpMetaText">
        <xsl:choose>
          <xsl:when test="$gItemHandle=''">
            <xsl:text>not available</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$ssd = 'true'">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
                  <xsl:value-of select="$gItemHandle"/>
                </a>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$gItemHandle"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </div>
  </xsl:template>


  <!-- METADATA: Short -->
  <xsl:template name="ItemMetadata">
    <div id="mdpItemMetadata">

      <xsl:element name="a">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:attribute name="name">SkipToBookInfo</xsl:attribute>
      </xsl:element>

      <xsl:element name="h2">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:text>Bibliographic Information about this book</xsl:text>
      </xsl:element>

      <div class="mdpMetaDataRow">
        <div class="mdpMetaDataRegionHead">
          <xsl:text>Title&#xa0;</xsl:text>
          <xsl:if test="/MBooksTop/MBooksGlobals/SSDSession='false'">
            <xsl:element name="a">
              <xsl:attribute name="id">mdpFlexible_1_1</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="'#'"/>
              </xsl:attribute>
              <xsl:attribute name="onclick">
                <xsl:value-of select="'javascript:ToggleCitationSize();'"/>
                <xsl:if test="$gGoogleOnclickTracking = 'true'">
                  <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT morelink'"/>
                </xsl:call-template>
                </xsl:if>
              </xsl:attribute>
              <xsl:attribute name="onkeypress">
                <xsl:value-of select="'javascript:ToggleCitationSize();'"/>
              </xsl:attribute>
              <xsl:text>more &#x00BB;</xsl:text>

            </xsl:element>
          </xsl:if>
        </div>

      <!-- Title -->
        <div class="mdpMetaText">
          <xsl:call-template name="BuildRDFaWrappedTitle">
            <xsl:with-param name="visible_title_string" select="$gTruncTitleString"/>
            <xsl:with-param name="hidden_title_string" select="$gFullTitleString"/>
          </xsl:call-template>
        </div>

        <div itemscope="" itemtype="http://schema.org/Book" style="display:none">
          <meta itemprop="accessibilityFeature" content="alternativeText"/>
          <meta itemprop="accessibilityFeature" content="bookmarks"/>
          <meta itemprop="accessibilityFeature" content="index"/>
          <meta itemprop="accessibilityFeature" content="longDescription"/>
          <meta itemprop="accessibilityFeature" content="readingOrder"/>
          <meta itemprop="accessibilityAPI"     content="ARIA"/>
          <meta itemprop="accessibilityControl" content="fullKeyboardControl"/>
          <meta itemprop="accessibilityControl" content="fullMouseControl"/>
          <xsl:call-template name="BuildSchemaOrgTitle">
            <xsl:with-param name="title" select="$gFullTitleString"/>
          </xsl:call-template>
          <xsl:call-template name="BuildSchemaOrgAuthor"/>
          <xsl:call-template name="BuildSchemaOrgUrl"/>
        </div>


      </div>

      <!-- Author, Edition, Published, Description -->
      <xsl:call-template name="MdpMetadataHelper"/>
    </div>

  </xsl:template>

  <!-- Link to OCLC Get Book -->
  <xsl:template name="FindInALibraryLink">
    <xsl:param name="class" />
    <xsl:param name="label">Find in a library</xsl:param>
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
      <xsl:variable name="oclc-number">
        <xsl:choose>
          <xsl:when test="contains(.,'OCoLC)ocm')">
            <xsl:value-of select="substring-after(.,'OCoLC)ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'OCoLC')">
            <xsl:value-of select="substring-after(.,'OCoLC)')"/>
          </xsl:when>
          <xsl:when test="contains(.,'oclc')">
            <xsl:value-of select="substring-after(.,'oclc')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocm')">
            <xsl:value-of select="substring-after(.,'ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocn')">
            <xsl:value-of select="substring-after(.,'ocn')"/>
          </xsl:when>
          <xsl:otherwise/>
        </xsl:choose>
      </xsl:variable>
      <xsl:element name="a">
        <xsl:attribute name="class">worldcat <xsl:value-of select="$class" /></xsl:attribute>
        <xsl:attribute name="href">
          <xsl:text>http://www.worldcat.org/oclc/</xsl:text>
          <xsl:value-of select="$oclc-number" />
        </xsl:attribute>
        <xsl:attribute name="data-toggle">tracking</xsl:attribute>
        <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
        <xsl:attribute name="data-tracking-action">PT Find in a Library</xsl:attribute>
        <xsl:attribute name="data-tracking-label"><xsl:value-of select="$oclc-number" /></xsl:attribute>
        <xsl:attribute name="title">Link to OCLC Find in a Library</xsl:attribute>

        <xsl:value-of select="$label" />

      </xsl:element>
    </xsl:for-each>

  </xsl:template>



  <!-- New Bookmark -->
  <xsl:template name="ItemBookmark">
    <div class="mdpBookmark">
      <xsl:choose>
        <xsl:when test="$gItemHandle=''">
          <xsl:text>not available</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <!-- The javascript function call uses double-quoted
               parameters but the title may have double quotes in it so
               escape those -->
          <xsl:variable name="safeBookmarkTitle">
            <xsl:call-template name="ReplaceChar">
              <xsl:with-param name="string">
                <xsl:value-of select="$gTruncTitleString"/>
              </xsl:with-param>
              <xsl:with-param name="from_char">
                <xsl:text>"</xsl:text>
              </xsl:with-param>
              <xsl:with-param name="to_char">
                <xsl:text>\"</xsl:text>
              </xsl:with-param>
            </xsl:call-template>
          </xsl:variable>

          <!-- -->
          <xsl:variable name="parameters">
            <xsl:value-of select="concat('&quot;', $safeBookmarkTitle, '&quot;', ',', '&quot;', $gItemHandle, '&quot;')"/>
          </xsl:variable>

          <!-- -->
          <xsl:variable name="theJS" select="concat('javascript:Bookmark(', $parameters, ');'  )"/>
          <xsl:element name="a">
            <xsl:attribute name="id">mdpBookmarkIcon</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="'#'"/>
            </xsl:attribute>
            <xsl:attribute name="onclick">
              <xsl:value-of select="$theJS"/>
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                  <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT bookmark'"/>
                </xsl:call-template>
            </xsl:if>

            </xsl:attribute>
            <xsl:attribute name="onkeypress">
              <xsl:value-of select="$theJS"/>
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                  <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT bookmark'"/>
                </xsl:call-template>
            </xsl:if>

            </xsl:attribute>

            <xsl:element name="img">
              <xsl:attribute name="src">//common-web/graphics/bookmark.gif</xsl:attribute>
              <xsl:attribute name="alt">Bookmark this item</xsl:attribute>
              <xsl:attribute name="title">Bookmark this item in your browser</xsl:attribute>
            </xsl:element>
          </xsl:element>
          <xsl:element name="a">
            <xsl:attribute name="id">mdpBookmarkLink2</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="'#'"/>
            </xsl:attribute>
            <xsl:attribute name="onclick">
              <xsl:value-of select="$theJS"/>
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT bookmark'"/>
                </xsl:call-template>
              </xsl:if>
          </xsl:attribute>

            <xsl:attribute name="onkeypress">
              <xsl:value-of select="$theJS"/>
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT bookmark'"/>
                </xsl:call-template>
              </xsl:if>
            </xsl:attribute>
            <xsl:text>bookmark</xsl:text>
          </xsl:element>
        </xsl:otherwise>
      </xsl:choose>
    </div>

  </xsl:template>


  <!-- FORM: Search -->
  <xsl:template name="BuildSearchForm">
    <xsl:param name="pSearchForm"/>
    <xsl:param name="pShowLabel" select="'YES'"/>

    <xsl:element name="form">
      <xsl:attribute name="class">
        <xsl:text>form-search-inside</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="onsubmit">
        <xsl:value-of select="'return FormValidation(this.q1, &quot;Please enter a term in the search box.&quot;)'"/>
      </xsl:attribute>
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">
            <xsl:text>/cgi/pt/search</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>/cgi/pt/search</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>

      <ul class="searchForm">
        <xsl:if test="$pShowLabel='YES'">
          <li id="mdpSearchFormLabel">
            <h2 id="SkipToSearch" tabindex="0">
              <label for="mdpSearchInputBox">
                <xsl:text>Search in this text</xsl:text>
              </label>
            </h2>
          </li>
        </xsl:if>

        <li class="asearchform">
          <xsl:apply-templates select="$pSearchForm/HiddenVars"/>
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">view</xsl:attribute>
            <xsl:attribute name="value"><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" /></xsl:attribute>
          </xsl:element>
          <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
            <xsl:element name="input">
              <xsl:attribute name="type">hidden</xsl:attribute>
              <xsl:attribute name="name">seq</xsl:attribute>
              <xsl:attribute name="value"><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" /></xsl:attribute>
            </xsl:element>
          </xsl:if>
          <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
            <xsl:element name="input">
              <xsl:attribute name="type">hidden</xsl:attribute>
              <xsl:attribute name="name">num</xsl:attribute>
              <xsl:attribute name="value"><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']" /></xsl:attribute>
            </xsl:element>
          </xsl:if>

          <xsl:element name="input">
            <xsl:attribute name="id">mdpSearchInputBox</xsl:attribute>
            <xsl:attribute name="class">input-text</xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="name">q1</xsl:attribute>
            <xsl:attribute name="maxlength">150</xsl:attribute>
            <xsl:attribute name="size">30</xsl:attribute>
            <xsl:if test="$gHasOcr!='YES'">
              <xsl:attribute name="disabled">disabled</xsl:attribute>
            </xsl:if>
            <xsl:choose>
              <xsl:when test="$gHasOcr='YES'">
                <xsl:if test="$gCurrentQ1 != '*'">
                  <xsl:attribute name="value">
                    <xsl:value-of select="$gCurrentQ1"/>
                  </xsl:attribute>
                </xsl:if>
              </xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="value">
                  <xsl:value-of select="'No text to search in this item'"/>
                </xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:element>
          <xsl:if test="$gHasOcr='YES'">
            <xsl:element name="input">
              <xsl:attribute name="id">mdpSearchButton</xsl:attribute>
              <xsl:attribute name="class">btn</xsl:attribute>
              <xsl:attribute name="type">submit</xsl:attribute>
              <xsl:attribute name="value">Search</xsl:attribute>
            </xsl:element>
          </xsl:if>
        </li>
      </ul>
      <xsl:call-template name="HiddenDebug"/>
    </xsl:element>

  </xsl:template>


  <!-- Feedback -->
  <xsl:template name="Feedback">

    <xsl:element name="h2">
      <xsl:attribute name="class">SkipLink</xsl:attribute>
      <xsl:text>Send feedback about this book</xsl:text>
    </xsl:element>

    <xsl:call-template name="BuildFeedbackForm"/>

  </xsl:template>

  <!-- UNICORN: SIDEBAR -->
  <xsl:template name="sidebar">
    <xsl:call-template name="BuildBackToResultsLink" />
    <xsl:call-template name="list-surveys" />

    <xsl:call-template name="build-pre-sidebar-panels" />

    <xsl:call-template name="sidebar-about-this-book" />
    <div class="scrollable">
      <xsl:call-template name="build-extra-sidebar-panels" />
      <xsl:call-template name="get-this-book" />
      <xsl:call-template name="download-this-book" />
      <xsl:if test="$gHasOcr = 'YES'">
        <xsl:call-template name="access-overview-block" />
      </xsl:if>
      <xsl:call-template name="collect-this-book" />
      <xsl:call-template name="share-this-book" />
      <xsl:call-template name="versionLabel" />
    </div>
  </xsl:template>

  <xsl:template name="build-pre-sidebar-panels" />
  <xsl:template name="build-extra-sidebar-panels" />

  <xsl:template name="access-overview-block">

    <xsl:variable name="gViewingMode">
      <xsl:choose>
        <xsl:when test="$gFinalAccessStatus='allow'">
          <xsl:choose>
            <!-- Case (1) SSD: display entire volume -->
            <xsl:when test="$gSSD_Session='true'">
              <xsl:value-of select="'entire-volume'"/>
            </xsl:when>
            <!-- non-SSD cases -->
            <xsl:when test="$gSSD_Session='false'">
              <xsl:choose>
                <!-- Case (2) non-SSD page-at-a-time -->
                <xsl:when test="$gInCopyright='false' and $gLoggedIn='NO'">
                  <xsl:value-of select="'page-at-a-time'"/>
                </xsl:when>
                <!-- Case (3) non-SSD: entire volume-->
                <xsl:when test="$gInCopyright='false' and $gLoggedIn='YES'">
                  <xsl:value-of select="'entire-volume'"/>
                </xsl:when>
                <!-- Case (4) non-SSD: page-at-a-time -->
                <xsl:when test="$gInCopyright='true' and $gLoggedIn='YES'">
                  <xsl:value-of select="'page-at-a-time'"/>
                </xsl:when>
              </xsl:choose>
            </xsl:when>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="'no-view'"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <div class="accessOverview panel" rel="note">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-file-text</xsl:with-param>
        </xsl:call-template>
        <span>Text Only Views</span>
      </h3>
        <xsl:if test="$gHtId">
          <p>
            <xsl:text>Go to the </xsl:text>
            <xsl:element name="a">
              <xsl:attribute name="id">ssd-link</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:text>/cgi/ssd?id=</xsl:text>
                <xsl:value-of select="$gHtId"/>
                <xsl:choose>
                  <xsl:when test="$seq != '' and $gViewingMode = 'entire-volume'">
                    <xsl:text>#seq</xsl:text>
                    <xsl:value-of select="$seq" />
                  </xsl:when>
                  <xsl:when test="$seq">
                    <xsl:text>;seq=</xsl:text>
                    <xsl:value-of select="$seq" />
                  </xsl:when>
                  <xsl:otherwise />
                </xsl:choose>
              </xsl:attribute>
              <xsl:text>text-only view of this item.</xsl:text>
            </xsl:element>
          </p>
        </xsl:if>
<!--         <xsl:if test="$gInCopyright = 'false'">
          <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        </xsl:if>
        <xsl:if test="$gInCopyright = 'true'">
          <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        </xsl:if> -->
        <p>See the <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</p>
    </div>
  </xsl:template>

  <xsl:template name="sidebar-about-this-book">

        <div itemscope="" itemtype="http://schema.org/Book" style="display:none">
          <meta itemprop="accessibilityFeature" content="alternativeText"/>
          <meta itemprop="accessibilityFeature" content="bookmarks"/>
          <meta itemprop="accessibilityFeature" content="index"/>
          <meta itemprop="accessibilityFeature" content="longDescription"/>
          <meta itemprop="accessibilityFeature" content="readingOrder"/>
          <meta itemprop="accessibilityAPI"     content="ARIA"/>
          <meta itemprop="accessibilityControl" content="fullKeyboardControl"/>
          <meta itemprop="accessibilityControl" content="fullMouseControl"/>
          <xsl:call-template name="BuildSchemaOrgTitle">
            <xsl:with-param name="title" select="$gFullTitleString"/>
          </xsl:call-template>
          <xsl:call-template name="BuildSchemaOrgAuthor"/>
          <xsl:call-template name="BuildSchemaOrgUrl"/>
        </div>

    <div class="bibLinks panel">

      <!-- <h3>About this Book</h3> -->
      <!-- <h3 class="offscreen">Catalog Record Details</h3> -->

      <h1 style="font-size: 1.2rem">
        <xsl:call-template name="BuildRDFaWrappedTitle">
          <xsl:with-param name="visible_title_string" select="$gTruncTitleString"/>
          <xsl:with-param name="hidden_title_string" select="$gFullTitleString"/>
        </xsl:call-template>
      </h1>

      <h2 style="margin-top: 1rem">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-info-square</xsl:with-param>
        </xsl:call-template>
        <span>About this Book</span>
      </h2>

      <p class="offscreen">
        <!-- <xsl:text> </xsl:text> -->

        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedAuthor"/>
        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedPublished"/>
        <!-- not visible -->
        <xsl:call-template name="BuildRDFaWrappedDescription" />
      </p>
      <p>
        <xsl:variable name="record_no">
          <xsl:value-of select="$gCatalogRecordNo"/>
        </xsl:variable>
        <xsl:choose>
          <xsl:when test="$record_no!=''">
            <xsl:element name="a">
              <xsl:variable name="href">
                <xsl:text>https://catalog.hathitrust.org/Record/</xsl:text>
                <xsl:value-of select="$record_no"/>
              </xsl:variable>
              <xsl:attribute name="data-toggle">tracking</xsl:attribute>
              <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
              <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
              <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
              <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
              <xsl:text>View full catalog record</xsl:text>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="display-catalog-record-not-available" />
          </xsl:otherwise>
        </xsl:choose>
      </p>
      <h3 style="border-bottom: none; font-size: 0.9rem; padding-bottom: 0; margin-top: 0.5rem; margin-bottom: 0">Rights</h3>
      <p class="smaller" style="margin-top: 0.25rem; margin-bottom: 0">
        <xsl:call-template name="BuildRDFaCCLicenseMarkup" />
      </p>
    </div>
  </xsl:template>

  <xsl:template name="display-catalog-record-not-available">
    <xsl:text>Catalog record not available</xsl:text>
  </xsl:template>

  <xsl:template name="get-this-book">

    <xsl:variable name="contents-tmp">
      <ul>
         <xsl:call-template name="find-in-library" />
         <xsl:call-template name="buy-this-item" />
         <xsl:call-template name="get-service-links" />
      </ul>
    </xsl:variable>
    <xsl:variable name="contents" select="exsl:node-set($contents-tmp)" />

    <xsl:if test="$contents//xhtml:li">

      <div class="getLinks panel">
        <h3>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-eye</xsl:with-param>
          </xsl:call-template>
          <span>Get this Book</span>
        </h3>

        <xsl:apply-templates select="$contents" mode="copy" />

      </div>

    </xsl:if>
  </xsl:template>

  <xsl:template name="download-this-book">
    <xsl:variable name="access-type" select="//AccessType" />

    <div class="download panel" data-experiment="v2">

      <style>
        .subpanel[data-experiment] { display: none; }
        .download[data-experiment="v0"] .subpanel[data-experiment="v0"] {
          display: block;
        }
        .download[data-experiment="v1"] .subpanel[data-experiment="v1"] {
          display: block;
        }
        .download[data-experiment="v2"] .subpanel[data-experiment="v2"] {
          display: block;
        }
        .download[data-experiment="v3"] .subpanel[data-experiment="v3"] {
          display: block;
        }
      </style>

      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-download</xsl:with-param>
        </xsl:call-template>
        <span>Download</span>
      </h3>

      <xsl:choose>
        <xsl:when test="$access-type/Name = 'emergency_access_affiliate' and $gFinalAccessStatus = 'allow' and $gUsingSearch = 'false' and $gSinglePagePdfAccess != 'allow'">
          <p>
            <a data-toggle="tracking" data-tracking-category="outLinks" data-tracking-action="PT ETAS-User-Information#download" data-tracking-label="ETAS-User-Information#download" href="https://www.hathitrust.org/ETAS-User-Information#download">Why isn't download available?</a>
          </p>
        </xsl:when>
        <xsl:otherwise>
          <!-- <div class="subpanel" data-experiment="v0">
            <ul>
              <xsl:call-template name="download-links" />
            </ul>
          </div>

          <div class="subpanel" data-experiment="v1">
            <xsl:call-template name="download-this-book-v1" />
          </div> -->

          <div class="subpanel" data-experiment="v2">
            <xsl:call-template name="download-this-book-v2" />
          </div>

          <!-- <div class="subpanel" data-experiment="v3">
            <xsl:call-template name="download-this-book-v3" />
          </div> -->
        </xsl:otherwise>
      </xsl:choose>

      <xsl:call-template name="no-download-access" />

      <!-- <script>
        var dlxd = document.querySelector('.download.panel');
        var dlxs = document.querySelector('#select-download-v');
        dlxs.addEventListener('change', function(event) {
          dlxd.dataset.experiment = dlxs.value;
        })
        dlxs.value = 'v2'; // force this
      </script> -->
    </div>
  </xsl:template>

  <xsl:template name="download-this-book-v2">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <xsl:variable name="access-type" select="//AccessType" />

    <style>

      .download fieldset {
        margin-top: 0.5rem;
      }

      .download fieldset legend {
        /* font-weight: bold; */
      }

      .download fieldset legend  {
        margin-bottom: 0.25rem;
      }

      .download .form-control label {
        padding-top: 0rem;
        padding-bottom: 0rem;
        font-size: 0.875rem;
      }

      .form-control[data-view-target] {
        display: none;
      }

      main[data-view="1up"] .form-control[data-view-target~="1up"] {
        display: block;
      }

      main[data-view="plaintext"] .form-control[data-view-target~="plaintext"] {
        display: block;
      }

      main[data-view="image"] .form-control[data-view-target~="image"] {
        display: block;
      }

      main[data-view="2up"] .form-control[data-view-target~="2up"] {
        display: block;
      }

      #download-selected-pages-output {
        font-size: 90%;
        color: #666;
        margin-left: 2.5rem;
        margin-bottom: 0.5rem;
      }

      #download-selected-pages-output ul {
        display: inline;
        list-style: none;
        padding: 0px;
      }

      #download-selected-pages-output li {
        display: inline;
      }      

      #download-selected-pages-output li::after {
        content: ", ";
      }

      #download-selected-pages-output li:last-child::after {
        content: "";
      }

      .form-download-module input + label {
        cursor: pointer;
      }

      .form-download-module input[disabled] + label {
        opacity: 0.4;
        pointer-events: none;
      }

      .form-download-module input[disabled] ~ * {
        opacity: 0.4;
        pointer-events: none;
      }

    </style>

    <xsl:variable name="show-download-module">
      <xsl:choose>
        <xsl:when test="$gFinalAccessStatus = 'deny'">false</xsl:when>
        <xsl:when test="$gUsingSearch = 'true' and $gFullPdfAccess = 'allow'">true</xsl:when>
        <xsl:when test="$gFullPdfAccess = 'allow'">true</xsl:when>
        <xsl:when test="$gSinglePagePdfAccess = 'allow'">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:if test="$show-download-module = 'true'">

      <form id="form-download-module" class="form-download-module v2" data-full-pdf-access="{$gFullPdfAccess}">
        <xsl:choose>
          <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
          <xsl:otherwise>
            <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
          </xsl:otherwise>
        </xsl:choose>

        <fieldset>
          <legend>Format</legend>

          <div class="form-control">
            <input name="download_format" type="radio" id="format-pdf" value="pdf" checked="checked" /> 
            <label for="format-pdf">PDF</label>
          </div>

          <xsl:if test="$gFullPdfAccess = 'allow'">
            <div class="form-control">
              <input name="download_format" type="radio" id="format-epub" value="epub" /> 
              <label for="format-epub">EPUB</label>
            </div>
          </xsl:if>

          <div class="form-control">
            <input name="download_format" type="radio" id="format-plaintext" value="plaintext" /> 
            <label for="format-plaintext">Text (.txt)</label>
          </div>

          <xsl:if test="$gFullPdfAccess = 'allow'">
            <div class="form-control">
              <input name="download_format" type="radio" id="format-archive" value="plaintext-zip" /> 
              <label for="format-archive">Text (.zip)</label>
            </div>
          </xsl:if>

          <div class="form-control">
            <input name="download_format" type="radio" id="format-image" value="image" /> 
            <label for="format-image">Image (JPEG)</label>
          </div>

        </fieldset>


        <fieldset>
          <legend>Range</legend>

          <div class="form-control" data-view-target="1up image plaintext" data-download-format-target="pdf plaintext image">
            <input name="range" type="radio" id="range-current-page" value="current-page" data-is-partial="true">
              <xsl:if test="$gFullPdfAccess != 'allow'">
                <xsl:attribute name="checked">checked</xsl:attribute>
              </xsl:if>
            </input>
            <label for="range-current-page">
              <xsl:text>Current page scan #</xsl:text>
              <span data-slot="current-seq"><xsl:value-of select="//Param[@name='seq']" /></span>
            </label>
          </div>

          <div class="form-control" data-view-target="2up" data-download-format-target="pdf plaintext image">
            <input name="range" type="radio" id="range-current-page-verso" value="current-page-verso" data-is-partial="true"/> 
            <label for="range-current-page-verso">
              <xsl:text>Left page scan #</xsl:text>
              <span data-slot="current-verso-seq"><xsl:value-of select="//Param[@name='seq']" /></span>
            </label>
          </div>

          <div class="form-control" data-view-target="2up" data-download-format-target="pdf plaintext image">
            <input name="range" type="radio" id="range-current-page-recto" value="current-page-recto" data-is-partial="true" /> 
            <label for="range-current-page-recto">
              <xsl:text>Right page scan #</xsl:text>
              <span data-slot="current-recto-seq"><xsl:value-of select="//Param[@name='seq']" /></span>
            </label>
          </div>

          <xsl:if test="$gFullPdfAccess = 'allow'">
            <div class="form-control" data-download-format-target="pdf epub plaintext plaintext-zip image">
              <input name="range" type="radio" id="download-volume" value="volume">
                <xsl:attribute name="checked">checked</xsl:attribute>
              </input> 
              <label for="download-volume">Whole book</label>
            </div>

            <xsl:if test="$gUsingSearch = 'false'">
              <div class="form-control" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap" data-download-format-target="pdf plaintext plaintext-zip image">
                <input name="range" type="radio" id="download-selected-pages" value="selected-pages" data-is-partial="true" /> 
                <label for="download-selected-pages" style="white-space: nowrap">Selected page scans</label>
                <button id="action-clear-selection" aria-label="Clear selection" class="btn btn-mini"><i class="icomoon icomoon-cancel"></i></button>
                <div id="download-selected-pages-output" style="flex-basis: 100%"><ul></ul></div>
              </div>
            </xsl:if>

          </xsl:if>

        </fieldset>

        <p style="margin-top: 0.5rem;">
          <button class="btn" type="submit">Download</button>
        </p>
      </form>

      <form id="tunnel-download-module" style="display: none" data-action-template="/cgi/imgsrv/download/" method="GET">
        <input data-fixed="true" type="hidden" name="id" value="{$gHtId}" />
        <input data-fixed="true" type="hidden" name="attachment" value="1" />
      </form>

    </xsl:if>
  </xsl:template>


  <xsl:template name="find-in-library">
    <xsl:variable name="x" select="$gMdpMetadata/datafield" />
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
      <xsl:variable name="oclc-number">
        <xsl:choose>
          <xsl:when test="contains(.,'OCoLC)ocm')">
            <xsl:value-of select="substring-after(.,'OCoLC)ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'OCoLC')">
            <xsl:value-of select="substring-after(.,'OCoLC)')"/>
          </xsl:when>
          <xsl:when test="contains(.,'oclc')">
            <xsl:value-of select="substring-after(.,'oclc')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocm')">
            <xsl:value-of select="substring-after(.,'ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocn')">
            <xsl:value-of select="substring-after(.,'ocn')"/>
          </xsl:when>
          <xsl:otherwise/>
        </xsl:choose>
      </xsl:variable>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Find in a Library</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$oclc-number" /></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:text>https://www.worldcat.org/oclc/</xsl:text>
            <xsl:value-of select="$oclc-number" />
          </xsl:attribute>
          <xsl:attribute name="title">Link to OCLC Find in a Library</xsl:attribute>
          <xsl:text>Find in a library</xsl:text>
        </xsl:element>
      </li>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="buy-this-item">
    <xsl:if test="$gPodUrl != ''">
      <li>
        <xsl:element name="a">
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Buy a copy</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$gPodUrl" /></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$gPodUrl"/>
          </xsl:attribute>
          <xsl:text>Buy a copy</xsl:text>
        </xsl:element>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template name="get-service-links">
    <xsl:for-each select="//MdpApp/ExternalLinks/Link">
      <li>
        <a href="{@href}"><xsl:text>Read at </xsl:text><xsl:value-of select="." /></a>
      </li>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="download-links">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <xsl:if test="$pViewTypeList//ViewTypePdfLink">
      <xsl:call-template name="download-links--pdf" />
    </xsl:if>
    <xsl:if test="$pViewTypeList//ViewTypeFullPdfLink">
      <xsl:call-template name="download-links--full-pdf" />
    </xsl:if>
    <xsl:if test="false() and $pViewTypeList//ViewTypeFullPdfLink">
      <xsl:call-template name="download-links--full-text" />
    </xsl:if>
    <xsl:if test="false() and $pViewTypeList//ViewTypeFullEpubLink">
      <xsl:call-template name="download-links--full-epub" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="download-links--pdf">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <xsl:variable name="access-type" select="//AccessType" />

    <xsl:if test="$access-type/Name = 'emergency_access_affiliate' and $gFinalAccessStatus = 'allow' and $gUsingSearch = 'false' and $gSinglePagePdfAccess != 'allow'">
      <li>
        <a data-toggle="tracking" data-tracking-category="outLinks" data-tracking-action="PT ETAS-User-Information#download" data-tracking-label="ETAS-User-Information#download" href="https://www.hathitrust.org/ETAS-User-Information#download">Why isn't download available?</a>
      </li>
    </xsl:if>
    <xsl:if test="$gFinalAccessStatus = 'allow' and $gUsingSearch = 'false' and $gSinglePagePdfAccess = 'allow'">
      <li data-view-target="1up image plaintext">
        <xsl:element name="a">
          <xsl:attribute name="id">pagePdfLink</xsl:attribute>
          <xsl:attribute name="class">page-pdf-link</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Download PDF - this page</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
          </xsl:attribute>
          <xsl:attribute name="target">
            <xsl:text>pdf</xsl:text>
          </xsl:attribute>
          <xsl:choose>
            <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>Download this page (PDF)</xsl:text>
        </xsl:element>
      </li>
      <li data-view-target="2up">
        <xsl:element name="a">
          <xsl:attribute name="id">pagePdfLink1</xsl:attribute>
          <xsl:attribute name="class">page-pdf-link</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Download PDF - left page</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
          </xsl:attribute>
          <xsl:attribute name="target">
            <xsl:text>pdf</xsl:text>
          </xsl:attribute>
          <xsl:choose>
            <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>Download left page (PDF)</xsl:text>
        </xsl:element>
      </li>
      <li data-view-target="2up">
        <xsl:element name="a">
          <xsl:attribute name="id">pagePdfLink2</xsl:attribute>
          <xsl:attribute name="class">page-pdf-link</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Download PDF - right page</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
          </xsl:attribute>
          <xsl:attribute name="target">
            <xsl:text>pdf</xsl:text>
          </xsl:attribute>
          <xsl:choose>
            <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>Download right page (PDF)</xsl:text>
        </xsl:element>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template name="download-links--full-pdf">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>

    <xsl:if test="$gFullPdfAccessMessage='' and $gUsingSearch = 'false'">
      <!-- only show this link if we have access -->
      <li>
        <xsl:element name="a">
          <xsl:attribute name="id">selectedPagesPdfLink</xsl:attribute>
          <xsl:attribute name="title">Download pages (PDF)</xsl:attribute>
          <xsl:attribute name="data-template">Download {PAGES} (PDF)</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking-action</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Download PDF - selection</xsl:attribute>
          <xsl:attribute name="range">yes</xsl:attribute>
          <xsl:attribute name="data-seq"></xsl:attribute>
          <xsl:attribute name="data-total">0</xsl:attribute>
          <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
          <xsl:choose>
            <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
          </xsl:attribute>
          <xsl:text>Download pages (PDF)</xsl:text>
        </xsl:element>
        <button data-toggle="tooltip" class="btn btn-mini" id="action-clear-selection" aria-label="Clear selection"><i class="icomoon icomoon-cancel"></i></button>
      </li>
    </xsl:if>

    <xsl:if test="$gFullPdfAccessMessage='' or $gFullPdfAccessMessage='NOT_AFFILIATED' or $gFullPdfAccessMessage='RESTRICTED_SOURCE'">
      <xsl:call-template name="download-full-book">
        <xsl:with-param name="id" select="'fullPdfLink'" />
        <xsl:with-param name="type" select="'PDF'" />
        <xsl:with-param name="link" select="$pViewTypeList/ViewTypeFullPdfLink" />
      </xsl:call-template>
      <!-- <xsl:call-template name="download-full-book">
        <xsl:with-param name="id" select="'fullEpubLink'" />
        <xsl:with-param name="type" select="'EPUB'" />
        <xsl:with-param name="link" select="$pViewTypeList/ViewTypeFullEpubLink" />
      </xsl:call-template> -->
    </xsl:if>
  </xsl:template>

  <xsl:template name="download-links--full-epub">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <xsl:if test="$gFullPdfAccessMessage=''">
      <xsl:call-template name="download-full-book">
        <xsl:with-param name="id" select="'fullEpubLink'" />
        <xsl:with-param name="type" select="'EPUB'" />
        <xsl:with-param name="link" select="$pViewTypeList/ViewTypeFullEpubLink" />
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

  <xsl:template name="download-links--full-text">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <xsl:variable name="link">
      <xsl:text>/cgi/imgsrv/download/text?id=</xsl:text>
      <xsl:value-of select="$gHtId" />
      <xsl:text>;format=</xsl:text>
    </xsl:variable>
    <xsl:if test="$gFullPdfAccessMessage=''">
      <xsl:call-template name="download-full-book">
        <xsl:with-param name="id" select="'fullTextBundleTextLink'" />
        <xsl:with-param name="type" select="'Text'" />
        <xsl:with-param name="link" select="concat($link, 'text')" />
      </xsl:call-template>
      <xsl:call-template name="download-full-book">
        <xsl:with-param name="id" select="'fullTextBundleZipLink'" />
        <xsl:with-param name="type" select="'ZIP'" />
        <xsl:with-param name="link" select="concat($link, 'zip')" />
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

  <xsl:template name="download-full-book">
    <xsl:param name="id" />
    <xsl:param name="type" />
    <xsl:param name="link" />
    <li class="download-item--{$type}">
      <xsl:choose>
        <xsl:when test="$gFullPdfAccessMessage='RESTRICTED_SOURCE'">
          <xsl:text>Download whole book (</xsl:text><xsl:value-of select="$type" /><xsl:text>)</xsl:text>
          <br />
          <i>Not available</i> (<a href="https://www.hathitrust.org/help_digital_library#FullPDF" target="_blank">why not?</a>)
        </xsl:when>
        <xsl:otherwise>
          <xsl:element name="a">
            <xsl:attribute name="title"><xsl:text>Download whole book (</xsl:text><xsl:value-of select="$type" /><xsl:text>)</xsl:text></xsl:attribute>
            <xsl:attribute name="id"><xsl:value-of select="$id" /></xsl:attribute>
            <xsl:attribute name="data-title"><xsl:value-of select="$type" /></xsl:attribute>
            <xsl:attribute name="data-toggle">tracking-action download</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action"><xsl:text>PT Download </xsl:text><xsl:value-of select="$type" /><xsl:text> - whole book</xsl:text></xsl:attribute>
            <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
            <xsl:choose>
              <xsl:when test="//UserHasRoleToggles[@activated='enhancedTextProxy'] = 'TRUE'"></xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="data-photocopier"><xsl:value-of select="//InCopyright" /></xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>
            <xsl:attribute name="href">
              <xsl:choose>
                <xsl:when test="$gLoggedIn = 'NO' or $gFullPdfAccessMessage = ''">
                  <xsl:value-of select="$link"/>
                </xsl:when>
                <xsl:otherwise>#</xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <xsl:text>Download whole book (</xsl:text><xsl:value-of select="$type" /><xsl:text>)</xsl:text>
          </xsl:element>
          <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
            <p class="pdfPartnerLoginLinkMessage">Partner login required</p>
          </xsl:if>
        </xsl:otherwise>
      </xsl:choose>
    </li>
  </xsl:template>

  <xsl:template name="no-download-access">
    <xsl:param name="type" select="'PDF'" />
    <xsl:if test="$gFullPdfAccess = 'deny'">
      <div id="noDownloadAccess" style="display: block; font-size: 90%">
        <xsl:choose>
          <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
            <p class="">
              <xsl:text>Partner institution members: </xsl:text>
              <strong><a class="trigger-login" data-close-target=".modal.login" href="{DOWNLOAD_LINK}">Login</a></strong>
              <xsl:text> to download this book.</xsl:text>
            </p>
            <p>
            <em>If you are not a member of a partner institution,
              <br />
              whole book download is not available.
              (<a href="https://www.hathitrust.org/help_digital_library#Download" target="_blank">why not?</a>)</em>
            </p>
          </xsl:when>
          <xsl:when test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
            <p>
              <xsl:text>Full </xsl:text><xsl:value-of select="$type" /><xsl:text> available only to authenticated users from </xsl:text>
              <a href="https://www.hathitrust.org/help_digital_library#LoginNotListed" target="_blank">HathiTrust partner institutions.</a>
            </p>
          </xsl:when>
          <xsl:when test="$gFullPdfAccessMessage = 'NOT_PD'">
            <p>
              <xsl:text>In-copyright books cannot be downloaded.</xsl:text>
            </p>
          </xsl:when>
          <xsl:when test="$gFullPdfAccessMessage = 'NOT_AVAILABLE'">
            <p>
              <xsl:text>This book cannot be downloaded.</xsl:text>
            </p>
          </xsl:when>
          <xsl:when test="$gFullPdfAccessMessage = 'RESTRICTED_SOURCE'">
              <xsl:comment>Handled above</xsl:comment>
          </xsl:when>
          <xsl:otherwise>
            <p>
              <xsl:text>Sorry.</xsl:text>
            </p>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="collect-this-book">
    <div class="collectionLinks panel">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-bookmark</xsl:with-param>
        </xsl:call-template>
        <span>Add to Collection</span>
      </h3>

      <xsl:call-template name="CollectionWidgetContainer" />
    </div>
  </xsl:template>

  <xsl:template name="share-with-services-link">
    <a class="share" href="#"><span class="icomoon-share"></span></a>
  </xsl:template>

  <xsl:template name="share-with-services-button">
    <button class="share btn btn-default"><span class="icomoon-share"></span></button>
  </xsl:template>

  <xsl:template name="get-sharable-handle-link">
    <xsl:value-of select="$gItemHandle" />
    <xsl:if test="$gUsingSearch = 'false'">
      <xsl:text>?urlappend=%3Bseq=</xsl:text>
      <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']"/>
    </xsl:if>
  </xsl:template>

  <xsl:template name="share-this-book">
    <xsl:variable name="pageLink">
      <xsl:call-template name="get-sharable-handle-link" />
    </xsl:variable>

    <div class="shareLinks panel">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-share-fill</xsl:with-param>
        </xsl:call-template>
        <span>Share</span>
      </h3>


      <xsl:call-template name="build-share-social-links">
        <xsl:with-param name="pageLink" select="$pageLink" />
      </xsl:call-template>

      <form action="" name="urlForm" id="urlForm">
        <label class="smaller" for="permURL">Permanent link to this book</label>
        <!-- <input type="text" name="permURL_link" id="permURL" class="email-permURL" onclick="document.urlForm.permURL_link.select();" readonly="readonly = true;" value="http://hdl.handle.net/2027/mdp.39015015394847" /> -->
        <xsl:element name="input">
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">permURL_link</xsl:attribute>
          <xsl:attribute name="id">permURL</xsl:attribute>
          <xsl:attribute name="class">email-permURL</xsl:attribute>
          <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Link to this Book</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$gItemHandle" /></xsl:attribute>
          <xsl:attribute name="readonly">readonly</xsl:attribute>
          <xsl:attribute name="value">
            <xsl:value-of select="$gItemHandle"/>
          </xsl:attribute>
        </xsl:element>

        <xsl:if test="$gUsingSearch = 'false'">
        <br />

        <label class="smaller" for="pageURL">Link to this page</label>

        <xsl:element name="input">
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">pageURL_link</xsl:attribute>
          <xsl:attribute name="id">pageURL</xsl:attribute>
          <xsl:attribute name="class">email-permURL</xsl:attribute>
          <xsl:attribute name="onclick">document.urlForm.pageURL_link.select();</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Link to this Page</xsl:attribute>
          <xsl:attribute name="readonly">readonly</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$pageLink" /></xsl:attribute>
          <xsl:attribute name="value"><xsl:value-of select="$pageLink" /></xsl:attribute>
        </xsl:element>
        </xsl:if>
      </form>

      <xsl:if test="$gFinalAccessStatus = 'allow'">
        <p>
          <xsl:element name="a">
            <xsl:attribute name="id">embedHtml</xsl:attribute>
            <xsl:attribute name="default-form">data-default-form</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="' '"/>
            </xsl:attribute>
            <xsl:text>Embed this book</xsl:text>
          </xsl:element>
        </p>
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="build-share-social-links">
    <xsl:param name="pageLink" />
    <div class="btn-group share-toolbar share-toolbar-seven social-links">
      <button data-service="facebook" data-url="{$pageLink}" class="btn"><i class="icomoon icomoon-facebook2"></i><span class="offscreen"> Share via Facebook</span></button>
      <button data-service="twitter" data-url="{$pageLink}" class="btn"><i class="icomoon icomoon-twitter2"></i><span class="offscreen"> Share via Twitter</span></button>
      <!-- <button data-service="plusone" data-url="{$pageLink}" class="btn"><i class="icomoon icomoon-google-plus"></i><span class="offscreen"> Share via Google+</span></button> -->
      <button data-service="reddit" data-url="{$pageLink}" class="btn"><i class="icomoon icomoon-reddit"></i><span class="offscreen"> Share via reddit</span></button>
      <button data-service="tumblr" data-url="{$pageLink}" data-media="" class="btn"><i class="icomoon icomoon-tumblr"></i><span class="offscreen"> Share via Tumblr</span></button>
      <button data-service="vkontakte" data-url="{$pageLink}" class="btn"><i class="icomoon icomoon-vk"></i><span class="offscreen"> Share via VK</span></button>
      <xsl:if test="$gUsingSearch = 'false'">
        <button data-service="pinterest" data-url="{$pageLink}" data-media="" class="btn"><i class="icomoon icomoon-pinterest-p"></i><span class="offscreen"> Share via Pinterest</span></button>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template name="versionLabel">
    <div class="versionContainer panel">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-file-diff</xsl:with-param>
        </xsl:call-template>
        <span>Version</span>
      </h3>
      <p>
        <span class="version-label"><xsl:value-of select="$gVersionLabel" /></span>
        <br />
        <a id="versionIcon" href="#">About the version <i class="icomoon icomoon-help" aria-hidden="true"></i></a>
      </p>
    </div>
  </xsl:template>

  <xsl:template name="versionLabel-xx">
    <div class="versionContainer panel" style="margin-top: 2rem">
      <h3 class="offscreen">About versions</h3>
      <strong>Version: </strong><xsl:value-of select="$gVersionLabel"/>
      <button id="versionIcon" default-form="data-default-form" aria-label="version label for this item">
        <i class="icomoon icomoon-help" aria-hidden="true"></i>
      </button>
    </div>
  </xsl:template>

  <!-- Collection Widget -->
  <xsl:template name="CollectionWidgetContainer">

    <!-- <xsl:variable name="collection_list_label">
      <xsl:choose>
        <xsl:when test="$gLoggedIn='YES'">
          <xsl:choose>
            <xsl:when test="$gCollectionList/Coll">
              <h4 class="offscreen">Collections with this Item</h4>
              <xsl:text>This item is in your collection(s):</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>This item is not in any of your collections</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:element name="a">
            <xsl:attribute name="class">PTloginLinkText trigger-login</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/MdpApp/LoginLink"/>
            </xsl:attribute>
            <xsl:text>Login</xsl:text>
          </xsl:element>
          <xsl:text> to make your personal collections permanent</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div class="collection-membership-summary">
      <xsl:copy-of select="$collection_list_label"/>
    </div> -->

    <xsl:if test="$gLoggedIn!='YES'">
      <p>
        <a class="PTloginLinkText trigger-login" href="{/MBooksTop/MdpApp/LoginLink}">Login</a>
        <xsl:text> to make your personal collections permanent.</xsl:text>
      </p>
    </xsl:if>

    <div>
      <xsl:if test="count($gCollectionList/Coll) = 0">
        <xsl:attribute name="class">hide</xsl:attribute>
      </xsl:if>
      <h4 style="margin-bottom: 0.5rem">This item is in these collections:</h4>
      <ul class="collection-membership" style="margin-bottom: 1rem">
        <xsl:for-each select="$gCollectionList/Coll">
          <li>
            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:value-of select="Url"/>
              </xsl:attribute>
              <xsl:value-of select="CollName"/>
            </xsl:element>
          </li>
        </xsl:for-each>
      </ul>
    </div>

    <xsl:call-template name="BuildAddToCollectionControl"/>

    <!-- add COinS -->
    <xsl:for-each select="$gMdpMetadata">
      <xsl:call-template name="marc2coins" />
    </xsl:for-each>

  </xsl:template>

  <!-- FORM: Add To Collection Form -->
  <xsl:template name="BuildAddToCollectionControl">
    <div class="select-collection">
      <label for="PTaddItemSelect"><xsl:text>Choose collection:</xsl:text></label>
      <select id="PTaddItemSelect" class="mdpColSelectMenu">
        <option value="__NEW__">New collection…</option>
        <xsl:for-each select="$gCollectionForm/CollectionSelect/Option">
          <option value="{Value}"><xsl:value-of select="Label" /></option>
        </xsl:for-each>
      </select>
      <!-- for-each just for context: there's only one -->
      <!-- <xsl:for-each select="$gCollectionForm/CollectionSelect">
        <xsl:call-template name="BuildHtmlSelect">
          <xsl:with-param name="id" select="'PTaddItemSelect'"/>
          <xsl:with-param name="class" select="'mdpColSelectMenu'"/>
        </xsl:call-template>
      </xsl:for-each> -->
      <!-- <br /> -->
      <button id="PTaddItemBtn" class="btn btn-small">Add</button>
    </div>
  </xsl:template>

  <!-- AJAX: build "add item to [new] collection" request URL -->
  <xsl:template name="GetAddItemRequestUrl">

    <xsl:variable name="id">
      <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>
    </xsl:variable>

    <xsl:variable name="ajax_request_partial_url">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">
            <xsl:text>../</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text></xsl:text>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:value-of select="concat('mb?', 'page=ajax', ';id=', $id )"/>
    </xsl:variable>

    <div id="PTajaxAddItemPartialUrl" class="hidden">
          <xsl:value-of select="$ajax_request_partial_url"/>

    </div>


  </xsl:template>

  <xsl:template name="BuildBackToResultsLink">
    <xsl:variable name="search-results-link" select="normalize-space(//SearchForm/SearchResultsLink)" />
    <xsl:variable name="in-item-results-link" select="normalize-space(//InItemResultsLink)" />
    <!-- <xsl:if test="$search-results-link or $in-item-results-link"> -->
      <div id="mdpBackToResults">
        <!-- <xsl:if test="normalize-space($in-item-results-link)"> -->
          <p>
            <xsl:attribute name="class">
              <xsl:text>ptsearch--wrapper</xsl:text>
              <xsl:if test="normalize-space($in-item-results-link)=''">
                <xsl:text> inactive</xsl:text>
              </xsl:if>
            </xsl:attribute>
            <a href="{$in-item-results-link}" class="ptsearch--link">
              <xsl:attribute name="data-toggle">tracking</xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Back to In Item Results</xsl:attribute>
              <xsl:text>&#171; Back to "In this Item" results</xsl:text>
            </a>
          </p>
        <!-- </xsl:if> -->

        <xsl:if test="$search-results-link">
          <p>
            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:value-of select="$search-results-link" />
              </xsl:attribute>
              <xsl:attribute name="data-toggle">tracking</xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Back to Search Results</xsl:attribute>
              <xsl:text>&#171; Back to </xsl:text>
              <xsl:apply-templates select="//SearchForm/SearchResultsLabel" mode="copy" />
            </xsl:element>
          </p>
        </xsl:if>
      </div>
    <!-- </xsl:if> -->
  </xsl:template>

  <xsl:template match="SearchResultsLabel" mode="copy">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <!-- -->
  <xsl:template match="Highlight">
    <xsl:element name="span">
      <xsl:copy-of select="@class"/>
      <xsl:apply-templates select="." mode="copy" />
    </xsl:element>
  </xsl:template>

  <!-- Preserve line breaks in OCR -->
  <xsl:template match="br">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template name="heading1">
    <xsl:element name="h1">
      <xsl:attribute name="class">offscreen</xsl:attribute>
      <xsl:call-template name="PageTitle" />
    </xsl:element>
  </xsl:template>

  <xsl:template name="PageTitle">
    <xsl:param name="detail" select="''" />
    <xsl:param name="suffix" select="'HathiTrust Digital Library'" />
    <xsl:param name="dash" select="'-'" />
    <xsl:param name="title" />
    <xsl:param name="tail" />

    <xsl:variable name="displayed-title">
      <xsl:choose>
        <xsl:when test="normalize-space($title)">
          <xsl:value-of select="normalize-space($title)" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:variable name="truncated-title">
            <xsl:call-template name="GetMaybeTruncatedTitle">
              <xsl:with-param name="titleString" select="$gTitleString"/>
              <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
              <xsl:with-param name="maxLength" select="$gTitleTruncAmt"/>
            </xsl:call-template>
          </xsl:variable>
          <xsl:value-of select="normalize-space($truncated-title)" />
        </xsl:otherwise>
      </xsl:choose>
      <xsl:if test="normalize-space($detail)">
        <xsl:value-of select="concat(' ', $dash, ' ')" />
        <xsl:value-of select="$detail" />
      </xsl:if>
    </xsl:variable>

    <xsl:value-of select="$displayed-title" />
    <xsl:choose>
      <xsl:when test="$gRightsAttribute='8'">
        <xsl:text> - Item Not Available </xsl:text>
      </xsl:when>
      <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow' and //AccessType/Name = 'emergency_access_affiliate'">
        <xsl:text> - Temporary Access </xsl:text>
      </xsl:when>
      <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
        <xsl:text> - Full View </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> - Limited View </xsl:text>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:if test="normalize-space($suffix)">
      <xsl:text> | </xsl:text>
      <xsl:value-of select="$suffix" />
    </xsl:if>

    <xsl:if test="normalize-space($tail)">
      <xsl:text> (</xsl:text>
      <xsl:value-of select="$tail" />
      <xsl:text>)</xsl:text>
    </xsl:if>

  </xsl:template>

  <!-- need to move the anchor elsewhere -->
  <xsl:template name="skipNavAnchor">
  </xsl:template>

</xsl:stylesheet>

